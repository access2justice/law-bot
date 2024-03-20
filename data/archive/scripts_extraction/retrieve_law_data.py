import json
import collections
from lxml import etree
from cobalt import AkomaNtosoDocument


# Function to fetch element by @eId
def get_element_by_id(akn_doc, element_id):
    """
    Get element and its body by @eId
    """
    return akn_doc.root.find(".//*[@eId='{}']".format(element_id))


def get_all_element_ids(xml_file):
    """
    Extract all @eId elements' name
    """
    elements = []
    tree = etree.parse(xml_file)
    for item in tree.xpath('.//*[@eId]'):
        elements.append(item.attrib['eId'])
    return elements


def extract_article_text(el, el_body):
    """
    Extract text from article's body
    """
    # handle edge cases that are not a simple article/paragraph 
    if 'listintro' in el:
        return el_body.text
    elif 'lbl' in el:
        try:
            return el_body.num.text + el_body.p.text
        except:
            return el_body.num
    else:
    # simple article/paragraph structures
        try:
            return el_body.content.p.text
        except:
            try: 
                return el_body.num.text
            except:
                return ""
            

def store_metadata(el_body):
    """
    Store article metadata
    """
    el_metadata = el_body.num.text
    try:
        el_metadata += f"{el_body.heading}"
    except:
        pass
    return el_metadata


def extract_article_num(el_body):
    """
    Extract article's number
    """
    article_num = el_body.num.b
    try:
        article_num += f" {el_body.num.i}"
    except:
        pass
    return article_num


def extract_article_metadata(previous_el, main_article_num, metadata):
    """
    Extract article metadata
    """
    metadata_elements = previous_el.split('/') # previous element was metadata, split it in pieces
    current_metadata_el_list = metadata_elements[0]
    el_metadata = [main_article_num, metadata[current_metadata_el_list]] # store main article number
    for m_el in metadata_elements[1:]: # get every single piece on the way to the article
        current_metadata_el_list += f"/{m_el}"
        el_metadata.append(metadata[current_metadata_el_list])
    return el_metadata


def get_articles(akn_doc, elements):
    """
    Extract all articles in a dict in the format 'article_eId': {'text': "...", 'metadata': [...]} per article
    """
    core = collections.defaultdict(dict)
    metadata = dict()

    for el_index in range(0, len(elements)):
        el = elements[el_index]
        el_body = get_element_by_id(akn_doc, el)
        # build metadata leading up to an article
        if el.startswith('part'):
            metadata[el] = store_metadata(el_body)
        # when element is an article
        if el.startswith('art'):
            previous_el = elements[el_index-1]
            # and it doesn't contain paragraphs
            if '/' not in el:
                # and previous element is an article
                if previous_el.startswith('art'):
                    # assign previous article's metadata
                    core[el]['metadata'] = core[previous_el]['metadata']
                else:
                    # if no previous article -> extract metadata based on built metadata
                    main_article_num = extract_article_num(el_body)
                    core[el]['metadata'] = extract_article_metadata(previous_el, main_article_num, metadata) 
            else:
                core[el]['text'] = extract_article_text(el, el_body)
                # assign previous article's metadata
                core[el]['metadata'] = core[previous_el]['metadata']
                
    return core
    

if __name__ == "__main__":
    xml_file = "SR-220-01012024-DE.xml"
    
    with open(xml_file, 'r') as f:
        xml_file_str = f.read()
    print("Read code of obligations")

    # Load Akoma Ntoso document
    akn_doc = AkomaNtosoDocument(xml_file_str)
    print("Converted AkomaNtoso document")
    elements = get_all_element_ids(xml_file)
    print("Fetched all @eId elements")
    articles = get_articles(akn_doc, elements)
    print("Extracted all articles")

    def json_serializable(obj):
        if not isinstance(obj, str):
            return obj.__str__()

    articles_list = []
    for key, value in articles.items():
        value['@eId'] = key
        articles_list.append(value)
    print("Reshaped articles to list")
    
    articles_json = json.dumps(articles_list, default=json_serializable)
    print("Converted articles to json")

    with open("obligationrecht.json", "w") as json_file:
        json_file.write(articles_json)
    print("Exported articles")