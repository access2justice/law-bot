from cobalt import AkomaNtosoDocument
import json
import re


# Arbeitsgesetz, ArG - SR-822.11-01092023-DE.xml
file = open("SR-822.11-01092023-DE.xml", encoding="utf8")
xml_data_de = file.read()
file.close()


akn_doc_de = AkomaNtosoDocument(xml_data_de)

base_url = akn_doc_de.root.act.meta.identification.FRBRExpression.FRBRuri.attrib["value"]
base_url = base_url.replace('fedlex.data.admin', 'fedlex.admin')
base_url = re.sub(r'\/\d{8}(\/\w+)$', '\\1', base_url)

excluded_text_tags = [f'{{{akn_doc_de.namespace}}}{tag}' for tag in ['authorialNote', 'ref']]


def get_element_clean_text(el):
    if el is None:
        return ''

    texts = []

    if el.text:
        texts.append(el.text.replace('\xa0', ' ').strip())

    for child_el in el.iterchildren():
        if child_el is not None and child_el.tag not in excluded_text_tags:
            child_txt = texts.append(get_element_clean_text(child_el))
            if child_txt:
                texts.append(child_txt)
        if child_el.tail:
            texts.append(child_el.tail.replace('\xa0', ' ').strip())

    return ' '.join(texts)


#get title and num of the document
doc_title = [get_element_clean_text(akn_doc_de.root.act.preface.p[1].docTitle) + ' ' + get_element_clean_text(akn_doc_de.root.act.preface.p[2])]
doc_num = ['SR ' + akn_doc_de.root.act.preface.p[0].docNumber.text]


def process_paragraph_blocklist(lst, blocklist, article_lnk, section_titles, article_title, level_eid):
    if blocklist is None:
        return

    # Within Blocklist, some articles have an ListIntroduction others don't. The Function handles both cases.
    # Process list introduction, if found
    if hasattr(blocklist, 'listIntroduction'):
        list_intro = blocklist.listIntroduction
        paragraph_txt = get_element_clean_text(list_intro)
        if paragraph_txt:
            lst.append({'text': paragraph_txt, 'metadata': article_lnk + doc_title + section_titles + article_title, '@eId': level_eid})

    # Process any list items (this allows to capture enumerated paragraphs), ex.: Art. 958 C
    if hasattr(blocklist, 'item'):
        for item in blocklist.item:
            if hasattr(item, 'p'):
                paragraph_txt = get_element_clean_text(item.p)
                if paragraph_txt:
                    lst.append({'text': paragraph_txt, 'metadata': article_lnk + doc_title + section_titles + article_title, '@eId': level_eid})

            # Handle blocklists nested within items
            if hasattr(item, 'blockList'):
                process_paragraph_blocklist(lst, item.blockList, article_lnk, section_titles, article_title, level_eid)


def process_article(lst, article, section_titles, level_eid):
    """
    Extract paragraphs from the different sections.
    Add paragraphs, metadata, and Id to a dictionary with the format:
    {"text": "string containing each paragraph individually",
    "metadata": [Article Link + Article number + sections names in one list](list),
    "@eId": article and paragraph information (inner "eId" attribute)}
    """
    # Check article
    if article is None:
        return lst

    article_title = [str(' '.join([str(el.text).replace('\xa0', ' ').strip() for el in article.num.getchildren()]).strip())]
    article_eid = article.attrib["eId"]
    article_url = [f'{base_url}#{article_eid}']

    # this excludes articles with no paragraphs like Art. 40g
    if not hasattr(article, 'paragraph') or len(article.paragraph) == 0:
        return lst

    for paragraph in article.paragraph:
        # Extract Paragraphs from Articles. Will cover the articles where these are not nested like Art. 1
        if hasattr(paragraph.content, 'p'):
            paragraph_txt = get_element_clean_text(paragraph.content.p)
            if paragraph_txt:
                lst.append({'text': paragraph_txt, 'metadata': article_url + doc_title + section_titles + article_title, '@eId':level_eid})

        # When an article has blocklist within content, it will call the function process_paragraph_blocklist
        # This occurs where there are enumerated items within an article. Ex. Art. 24
        if hasattr(paragraph.content, 'blockList'):
            process_paragraph_blocklist(lst, paragraph.content.blockList, article_url, section_titles, article_title, level_eid)

    return lst


def process_sections(lst, sections, section_titles, level_eid):
    """Retrieve all the sections and call function find_article"""
    for section in sections:
        if hasattr(section, 'num') or not section.num:

            section_title = str(get_element_clean_text(section.num)).replace('\xa0', ' ').strip()
            if hasattr(section, 'heading'):
                section_title += ' ' + str(' '.join([headingtext.text.strip() for headingtext in section.heading])).replace('\xa0', ' ').strip()
            lst = find_articles(lst, section, section_titles + [section_title], level_eid)
        else:
            lst = find_articles(lst, section, section_titles, level_eid)

    return lst


def find_articles(lst, parent, section_titles, level_eid = 'N/A'):
    """Look for article tag to trigger the function process_article"""
    # Check parent
    if parent is None:
        return lst

    # Find all articles that are children of this parent
    if hasattr(parent, 'article'):
        for article in parent.article:
            lst = process_article(lst, article, section_titles, level_eid)

    # Find all sections of type level
    if hasattr(parent, 'level'):
        level_eid = parent.level.attrib["eId"]
        lst = process_sections(lst, parent.level, section_titles, level_eid)


    return lst


# create an empty list and then call the function find_articles to get the articles paragraphs (SR220 - Obligationenrecht)
lst_data_compiled_de = []
lst_data_compiled_de = find_articles(lst_data_compiled_de, akn_doc_de.root.act.body, [])


# # Grouping the data by article, each entry on dictionary will have all the text associated to it (all paragraphs merged) in a string within the key 'text'
# # This XML does not have articles eIds used eId closer to the extracted text - level eId - to the eId entry on the json file
# # create a new dict to group the data using the links as keys
by_article = {}
for elem in lst_data_compiled_de:
    article_key = elem['metadata'][0]
    elem['metadata'][-1] = elem['metadata'][-1].replace("None", "")
    elem['metadata'][-1] += ' ARG'
    if article_key not in by_article:
        by_article[article_key] = {'text': elem['text'], 'metadata': elem['metadata'], '@eIds': [elem['@eId']]}
    else:
        by_article[article_key]['text'] += ' ' + elem['text']


# removing the article link as a key that was used to group the data so that he exported data in the json format has the same structure
values_by_article = list(by_article.values())

with open('ArG.json', 'w', encoding='utf-8') as file:
    json.dump(lst_data_compiled_de, file, indent=2, ensure_ascii=False)

with open('ArG_by_article.json', 'w', encoding='utf-8') as file:
    json.dump(values_by_article, file, indent=2, ensure_ascii=False)