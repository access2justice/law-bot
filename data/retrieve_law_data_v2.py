from cobalt import AkomaNtosoDocument
import json
import re


# Obligationenrecht - SR-220-01012024-DE-newdownload.xml
# "https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20240101/de/xml/fedlex-data-admin-ch-eli-cc-27-317_321_377-20240101-de-xml-3.xml"



# SR220 - Obligationenrecht
file = open("SR-220-01012024-DE.xml", encoding="utf8")
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


def process_paragraph_blocklist(lst, blocklist, article_lnk, article_title, section_titles):
    if blocklist is None:
        return

    # Within Blocklist, some articles have an ListIntroduction others don't. The Function handles both cases.
    # Process list introduction, if found
    if hasattr(blocklist, 'listIntroduction'):
        list_intro = blocklist.listIntroduction
        article_paragraph = list_intro.attrib["eId"]
        paragraph_txt = get_element_clean_text(list_intro)
        if paragraph_txt:
            lst.append({'text': paragraph_txt, 'metadata': article_lnk + article_title + section_titles, '@eId': article_paragraph})

    # Process any list items (this allows to capture enumerated paragraphs), ex.: Art. 958 C
    if hasattr(blocklist, 'item'):
        for item in blocklist.item:
            if hasattr(item, 'p'):
                article_paragraph = item.attrib["eId"]
                paragraph_txt = get_element_clean_text(item.p)
                if paragraph_txt:
                    lst.append({'text': paragraph_txt, 'metadata': article_lnk + article_title + section_titles, '@eId': article_paragraph})

            # Handle blocklists nested within items
            if hasattr(item, 'blockList'):
                process_paragraph_blocklist(lst, item.blockList, article_lnk, article_title, section_titles)


def process_article(lst, article, section_titles):
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
            article_paragraph = paragraph.attrib['eId']
            paragraph_txt = get_element_clean_text(paragraph.content.p)
            if paragraph_txt:
                lst.append({'text': paragraph_txt, 'metadata': article_url + article_title + section_titles, '@eId': article_paragraph})

        # When an article has blocklist within content, it will call the function process_paragraph_blocklist
        # This occurs where there are enumerated items within an article. Ex. Art. 24
        if hasattr(paragraph.content, 'blockList'):
            process_paragraph_blocklist(lst, paragraph.content.blockList, article_url, article_title, section_titles)

    return lst


def process_sections(lst, sections, section_titles):
    """Retrieve all the sections and call function find_article"""
    for section in sections:
        if hasattr(section, 'num') or not section.num:

            section_title = str(get_element_clean_text(section.num)).replace('\xa0', ' ').strip()
            if hasattr(section, 'heading'):
                section_title += ' ' + str(' '.join([headingtext.text.strip() for headingtext in section.heading])).replace('\xa0', ' ').strip()
            lst = find_articles(lst, section, section_titles + [section_title])
        else:
            lst = find_articles(lst, section, section_titles)

    return lst


def find_articles(lst, parent, section_titles):
    """Look for article tag to trigger the function process_article"""
    # Check parent
    if parent is None:
        return lst

    # Find all articles that are children of this parent
    if hasattr(parent, 'article'):
        for article in parent.article:
            lst = process_article(lst, article, section_titles)

    # Find all sections of type part
    if hasattr(parent, 'part'):
        # print('FOUND PARTS')
        lst = process_sections(lst, parent.part, section_titles)

    # Find all sections of type title
    if hasattr(parent, 'title'):
        lst = process_sections(lst, parent.title, section_titles)

    # Find all sections of type chapter
    if hasattr(parent, 'chapter'):
        lst = process_sections(lst, parent.chapter, section_titles)

    # Find all sections of type level
    if hasattr(parent, 'level'):
        lst = process_sections(lst, parent.level, section_titles)

    return lst


# create an empty list and then call the function find_articles to get the articles paragraphs (SR220 - Obligationenrecht)
lst_data_compiled_de = []
lst_data_compiled_de = find_articles(lst_data_compiled_de, akn_doc_de.root.act.body, [])


# Grouping the data by article, each entry on dictionary will have all the text associated to it (all paragraphs merged) in a string within the key 'text'
# and all eIds will be in a list with the key '@eIds'. Metadata stays the same since is the same metadata.
# create a new dict to group the data using the links as keys
by_article = {}
for elem in lst_data_compiled_de:
    article_key = elem['metadata'][0]
    if article_key not in by_article:
        by_article[article_key] = {'text': elem['text'], 'metadata': elem['metadata'], '@eIds': [elem['@eId']]}
    else:
        by_article[article_key]['text'] += ' ' + elem['text']
        by_article[article_key]['@eIds'].append(elem['@eId'])

# removing the article link as a key that was used to group the data so that he exported data in the json format has the same structure
values_by_article = list(by_article.values())

with open('obligationrecht_v2.json', 'w', encoding='utf-8') as file:
    json.dump(lst_data_compiled_de, file, indent=2, ensure_ascii=False)

with open('obligationrecht_by_article.json', 'w', encoding='utf-8') as file:
    json.dump(values_by_article, file, indent=2, ensure_ascii=False)


# test_1 = akn_doc_de.root.act.body.part.title.chapter.level[7].level[0].article.paragraph[1]
#
# print('current approach', (get_element_clean_text(test_1)))
# for text in test_1.iterchildren():
#     print(text)
#     print(text.tail)
#     print(text.getnext())
#     for t in text.iterchildren():
#         print(t)
#         print(t.tail)
#         print(t.getnext())
# for x in test_1.content.itertext():
#     print(x)
#
