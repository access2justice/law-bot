
from cobalt import AkomaNtosoDocument
import json

# Xml for the german version
# "https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20240101/de/xml/fedlex-data-admin-ch-eli-cc-27-317_321_377-20240101-de-xml-3.xml"


# Check if it works for the Zivilgesetzbuch
# "https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/24/233_245_233/20240101/de/xml/fedlex-data-admin-ch-eli-cc-24-233_245_233-20240101-de-xml-15.xml "


# file = open("SR-220-01012024-DE-newdownload.xml", encoding="utf8")
# xml_data_de = file.read()
# file.close()

file = open("SR-210-01012024-DE.xml", encoding="utf8")
xml_data_de = file.read()
file.close()

akn_doc_de = AkomaNtosoDocument(xml_data_de)


def get_element_clean_text(element):
    if not hasattr(element, 'text') or not element.text:
        return ''

    return str(element.text).replace('\xa0', ' ').strip()


def process_paragraph_blocklist(lst, blocklist, article_title, section_titles):
    if blocklist is None:
        return

    # Within Blocklist, some articles have an ListIntroduction others don't. The Function handles both cases.
    # Process list introduction, if found
    if hasattr(blocklist, 'listIntroduction'):
        list_intro = blocklist.listIntroduction
        article_paragraph = list_intro.attrib["eId"]
        paragraph_txt = get_element_clean_text(list_intro)
        if paragraph_txt:
            lst.append({'text': paragraph_txt, 'metadata': article_title + section_titles, "@eId": article_paragraph})
        if hasattr(list_intro, 'inline'):
            paragraph_txt = ''
            # art_958_c/para_1/listintro paragraph separated into 2 inline tags, this allows to capture the full sentence
            for paragraph_inline in list_intro.inline:
                paragraph_txt += ' ' + get_element_clean_text(paragraph_inline)
            paragraph_txt = paragraph_txt.strip()
            if paragraph_txt:
                lst.append({'text': paragraph_txt, 'metadata': article_title + section_titles, "@eId": article_paragraph})

    # Process any list items (this allows to capture enumerated paragraphs), ex.: Art. 958 C
    if hasattr(blocklist, 'item'):
        for item in blocklist.item:
            if hasattr(item, 'p'):
                article_paragraph = item.attrib["eId"]
                paragraph_txt = get_element_clean_text(item.p)
                if paragraph_txt:
                    lst.append({'text': paragraph_txt, 'metadata': article_title + section_titles, "@eId": article_paragraph})
                if hasattr(item.p, 'inline'):
                    paragraph_txt = get_element_clean_text(item.p.inline)
                    if paragraph_txt:
                        lst.append({'text': paragraph_txt, 'metadata': article_title + section_titles, "@eId": article_paragraph})

            # Handle blocklists nested within items
            if hasattr(item, 'blockList'):
                process_paragraph_blocklist(lst, item.blockList, article_title, section_titles)


def process_article(lst, article, section_titles):
    """
    Extract paragraphs from the different sections.
    Add paragraphs, metadata, and Id to a dictionary with the format:
    {"text": "string containing each paragraph individually",
    "metadata": [Article number + sections names in one list](list),
    "@eId": article and paragraph information (inner "eId" attribute)}
    """
    # Check article
    if article is None:
        return lst

    article_title = [str(' '.join([get_element_clean_text(x) for x in article.num.getchildren()]).strip())]

    # this excludes articles with no paragraphs like Art. 40g
    if not hasattr(article, 'paragraph') or len(article.paragraph) == 0:
        return lst

    for paragraph in article.paragraph:
        # Extract Paragraphs from Articles. Will cover the articles where these are not nested like Art. 1
        if hasattr(paragraph.content, 'p'):
            article_paragraph = paragraph.attrib["eId"]
            paragraph_txt = get_element_clean_text(paragraph.content.p)
            if paragraph_txt:
                lst.append({'text': paragraph_txt, 'metadata': article_title + section_titles, "@eId": article_paragraph})
            # extract the ones where the paragraph is within an additional <inline> tag
            if hasattr(paragraph.content.p, 'inline'):
                paragraph_txt = get_element_clean_text(paragraph.content.p.inline)
                if paragraph_txt:
                    lst.append({'text': paragraph_txt, 'metadata': article_title + section_titles, "@eId": article_paragraph})

        # When an article has blocklist within content, it will call the function process_paragraph_blocklist
        # This occurs where there are enumerated items within an article. Ex. Art. 24
        if hasattr(paragraph.content, 'blockList'):
            process_paragraph_blocklist(lst, paragraph.content.blockList, article_title, section_titles)

    return lst


def process_sections(lst, sections, section_titles):
    """Retrieve all the sections and call function find_article"""
    for section in sections:
        if hasattr(section, 'num') or not section.num:
            section_title = str(section.num).replace('\xa0', ' ').strip()
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
        df = process_sections(lst, parent.chapter, section_titles)

    # Find all sections of type level
    if hasattr(parent, 'level'):
        df = process_sections(lst, parent.level, section_titles)

    return lst


# # create an empty list and then call the function find_articles to get the articles paragraphs
# lst_data_compiled_de = []
# lst_data_compiled_de = find_articles(lst_data_compiled_de, akn_doc_de.root.act.body, [])
#
# with open('cleaned_pflichten_des_arbeitsgebers_full_de_v2.json', 'w', encoding='utf-8') as file:
#     json.dump(lst_data_compiled_de, file, indent=2, ensure_ascii=False)


# create an empty list and then call the function find_articles to get the articles paragraphs
lst_data_compiled_de = []
lst_data_compiled_de = find_articles(lst_data_compiled_de, akn_doc_de.root.act.body, [])

with open('cleaned_pflichten_des_zivilgesetzbuch_full_de.json', 'w', encoding='utf-8') as file:
    json.dump(lst_data_compiled_de, file, indent=2, ensure_ascii=False)