
from SPARQLWrapper import SPARQLWrapper, JSON
import pandas as pd
import requests
from xml.etree import ElementTree
import time


def read_sparql(endpoint,query):
    """

    Parameters
    ----------
    endpoint : str
        Enpoint for SPARQL to fedlex.
    query : str
        SPARQL query rerturning the Swiss laws.

    Returns
    -------
    results : JSON
        data retrieved from the endpoint for Notation, Applicability Date, law texts in German,Italian and Franch.

    """
    sparql = SPARQLWrapper(endpoint)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()
    return results

def transform_json_to_df(json):
    """  

    Parameters
    ----------
    json : str
        data retrieved from the endpoint .

    Returns
    -------
    df : DataFrame
        transformed data.

    """
    

    df=pd.DataFrame(columns=["srNotation_value","dateApplicability_value","xmlUrlDEU_value","xmlUrlFRA_value","xmlUrlITA_value"])
    
    for n,i in enumerate(json["results"]["bindings"]):
        df.loc[n,"srNotation_value"]=i["srNotation"]["value"]
        df.loc[n,"dateApplicability_value"]=i["dateApplicability"]["value"]
        
        #safty check for are all languages. Sometimes not all laws are in all languages.
        try:
            df.loc[n,"xmlUrlDEU_value"]=i["xmlUrlDEU"]["value"]
        except Exception as e:
            print("Row", n, "DEU: An error occurred:", e)
        try:
                df.loc[n,"xmlUrlFRA_value"]=i["xmlUrlFRA"]["value"]
        except Exception as e:
                print("Row", n,"FRA: An error occurred:", e)
        try:
                df.loc[n,"xmlUrlITA_value"]=i["xmlUrlITA"]["value"]
        except Exception as e:
                print("Row", n,"ITA: An error occurred:", e)
                
    return df

def get_law_xml(url):
    response=requests.get(url)
    content=response.content
    return content

if __name__ == "__main__":
    
    ENDPOINT="https://fedlex.data.admin.ch/sparqlendpoint"
    QUERY='''
        PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        SELECT DISTINCT
            (str(?srNotation) as ?srNotation)
            (str(?dateApplicability) as ?dateApplicability)
            (str(?dateEndApplicability) as ?dateEndApplicability)
            (str(?dateNoLongerInForce) as ?dateNoLongerInForce)
            ?xmlUrlDEU ?xmlUrlFRA ?xmlUrlITA
        WHERE {
            ?consolidation a jolux:Consolidation .
            ?consolidation jolux:isMemberOf ?cc .
            ?cc jolux:classifiedByTaxonomyEntry/skos:notation ?srNotation .
            FILTER(datatype(?srNotation) = <https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique>)
            OPTIONAL { ?cc jolux:dateNoLongerInForce ?dateNoLongerInForce . }
            OPTIONAL { ?consolidation jolux:dateApplicability ?dateApplicability . }
            OPTIONAL { ?consolidation jolux:dateEndApplicability ?dateEndApplicability . }
            OPTIONAL {
                ?consolidation jolux:isRealizedBy ?consoExprDEU .
                ?consoExprDEU jolux:language <http://publications.europa.eu/resource/authority/language/DEU> .
                ?consoExprDEU jolux:isEmbodiedBy ?consoManifestationDEU .
                ?consoManifestationDEU jolux:userFormat <https://fedlex.data.admin.ch/vocabulary/user-format/xml> .
                ?consoManifestationDEU jolux:isExemplifiedBy ?xmlUrlDEU .
            }
            OPTIONAL {
                ?consolidation jolux:isRealizedBy ?consoExprFRA .
                ?consoExprFRA jolux:language <http://publications.europa.eu/resource/authority/language/FRA> .
                ?consoExprFRA jolux:isEmbodiedBy ?consoManifestationFRA .
                ?consoManifestationFRA jolux:userFormat <https://fedlex.data.admin.ch/vocabulary/user-format/xml> .
                ?consoManifestationFRA jolux:isExemplifiedBy ?xmlUrlFRA .
            }
            OPTIONAL {
                ?consolidation jolux:isRealizedBy ?consoExprITA .
                ?consoExprITA jolux:language <http://publications.europa.eu/resource/authority/language/ITA> .
                ?consoExprITA jolux:isEmbodiedBy ?consoManifestationITA .
                ?consoManifestationITA jolux:userFormat <https://fedlex.data.admin.ch/vocabulary/user-format/xml> .
                ?consoManifestationITA jolux:isExemplifiedBy ?xmlUrlITA .
            }
            FILTER(bound(?xmlUrlDEU) || bound(?xmlUrlFRA) || bound(?xmlUrlITA))
        }
        ORDER BY ?srNotation
    '''
    
    resp_sparql=read_sparql(ENDPOINT,QUERY)
    resp_df=transform_json_to_df(resp_sparql)
    
    ### obtain all laws. Example for 10 first laws in German. Change column to have other languages.
    for url in resp_df.loc[0:10,"xmlUrlDEU_value"]:
        time.sleep(1)
        print(get_law_xml(url))
    
