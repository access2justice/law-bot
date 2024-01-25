#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Jan 16 15:38:34 2024

@author: paulina
"""

import xmltodict
import json
import pandas as pd


def extract_paragraphs_recursive(json_data, current_article_name=None):
    """Extracts paragraphs recursively from nested JSON data.

    This function iterates through the JSON recursively. If a dictionary is encountered,
    it checks if it contains an '@eId' key, which is assumed to represent the current article name.
    If it contains a 'content' key with a value that includes 'p', it assumes it contains paragraphs
    and extracts them along with the current article name. 

    Args:
        json_data (dict or list): The JSON data to extract paragraphs from.
        current_article_name (str, optional): The name of the current article being processed.

    Returns:
        list: A list of dictionaries containing extracted paragraphs and their associated article names.
              Each dictionary has keys 'article_name' and 'paragraph'.
    """
    paragraphs = []

    if isinstance(json_data, dict):
        for key, value in json_data.items():
            if key == '@eId':
                current_article_name = value
                
            elif key == 'content' and 'p' in value:
                paragraphs.append({
                    'article_name': current_article_name,
                    'paragraph': value['p']
                })
                
            else:
                paragraphs.extend(extract_paragraphs_recursive(value, current_article_name))
    elif isinstance(json_data, list):
        for item in json_data:
            paragraphs.extend(extract_paragraphs_recursive(item, current_article_name))

    return paragraphs


################################
#####Read and prepare data######
################################


#read the xml file downloaded manually
with open("SR-220-01012024-DE.xml") as xml_file:
    data_dict = xmltodict.parse(xml_file.read())

#transform and save  xml as json.
json_data = json.dumps(data_dict)

with open("data.json", "w") as json_file:
        json_file.write(json_data)
f = open('data.json')
data = json.load(f)

#######################
#####Extract data######
#######################



##Extract only pflichten des Arbeitsgebers - part of OR that is interessting for testing
json_parts=data["akomaNtoso"]["act"]["body"]["part"][1]["title"][5]["chapter"][0]["level"][2]
num=json_parts["num"]
data=[] #list for extracted data

##level_1 means first level of levels(part of a jsom)
for level_1 in json_parts["level"]:
    pflicht=level_1["num"]  #Titel of law/obligation
    
    #if in the next conscutive keys level is presented
    if 'level' in level_1.keys(): 
        
        for i in  range(0,len(level_1["level"])):
          
            extracted=extract_paragraphs_recursive(level_1["level"]) #return article name and paragraphs
            #prepare dictionary containing obligation (Pflicht),article name, paragraph number and text
            for j in range(0,len(extracted)): 
                print(extracted[j]["paragraph"])
                art=extracted[j]["article_name"].split("/")[0]
                para=extracted[j]["article_name"].split("/")[1]
                dictionary={"Level1":pflicht,"p_text": extracted[j]["paragraph"], "p_num": para, "art":art}
                data.append(dictionary)

    #if in the next conscutive keys article is presented  instead of level 
    elif 'article' in level_1.keys():
          
          for i in  range(0,len(level_1["article"])):
              extracted=extract_paragraphs_recursive(level_1["article"]) #return article name and paragraphs
             
              #prepare dictionary containing obligation (Pflicht),article name, paragraph number and text
              for j in range(0,len(extracted)): 
                  print(extracted[j]["paragraph"])
                  art=extracted[j]["article_name"].split("/")[0]
                  para=extracted[j]["article_name"].split("/")[1]
                  dictionary={"Level1":pflicht,"p_text": extracted[j]["paragraph"], "p_num": para, "art":art}
                  data.append(dictionary)             
    
#baed on the list containing relevant data create dataframe                         
df=pd.DataFrame(data)

#based on the Obligation (Pflicht) and article name concatenate paragraph into one piece of text
df_concat=df.groupby(by=["Level1","art"]).agg(lambda x: ' '.join(x.astype(str))).reset_index()

####################
####save results####
####################
df_concat.to_json("cleaned_pflichten_des_arbeitsgebers.json")
df_concat.to_csv("cleaned_pflichten_des_arbeitsgebers.csv",sep=";")
