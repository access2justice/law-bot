#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Jan 16 15:38:34 2024

@author: paulina
"""

import xmltodict
import json
import pandas as pd

with open("SR-220-01012024-DE.xml") as xml_file:
    data_dict = xmltodict.parse(xml_file.read())

json_data = json.dumps(data_dict)

with open("data.json", "w") as json_file:
        json_file.write(json_data)


f = open('data.json')
 
# returns JSON object as 
# a dictionary
data = json.load(f)


# def extract_paragraphs_recursive(json_data):
#     paragraphs = []
#     art=[]
#     if isinstance(json_data, dict):
        
#         for key, value in json_data.items():
        
#             if key == 'content' and 'p' in value:
#                 paragraphs.append(value['p'])
#                 print(value["p"])
                
#             else:
#                 paragraphs.extend(extract_paragraphs_recursive(value))
#     elif isinstance(json_data, list):
#         for item in json_data:
#             paragraphs.extend(extract_paragraphs_recursive(item))

#     return paragraphs

def extract_paragraphs_recursive(json_data, current_article_name=None):
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


##Only pflichten des Arbeitsgebers
json_parts=data["akomaNtoso"]["act"]["body"]["part"][1]["title"][5]["chapter"][0]["level"][2]
num=json_parts["num"]
data=[]
#df=pd.DataFrame(columns=["Level1","art","p_num","p_text"])


for level_1 in json_parts["level"]:
    pflicht=level_1["num"]
   # print("*",pflicht)
    if 'level' in level_1.keys():
        
        for i in  range(0,len(level_1["level"])):
          #  print(level_1["level"][i]["num"])
            extracted=extract_paragraphs_recursive(level_1["level"])
           
            for j in range(0,len(extracted)): 
                print(extracted[j]["paragraph"])
             #   len_df=len(df)
                art=extracted[j]["article_name"].split("/")[0]
                para=extracted[j]["article_name"].split("/")[1]
                dictionary={"Level1":pflicht,"p_text": extracted[j]["paragraph"], "p_num": para, "art":art}
                data.append(dictionary)

    
    elif 'article' in level_1.keys():
          
          for i in  range(0,len(level_1["article"])):
            #  print(level_1["level"][i]["num"])
              extracted=extract_paragraphs_recursive(level_1["article"])
             
              for j in range(0,len(extracted)): 
                  print(extracted[j]["paragraph"])
                #  len_df=len(df)
                  art=extracted[j]["article_name"].split("/")[0]
                  para=extracted[j]["article_name"].split("/")[1]
                  dictionary={"Level1":pflicht,"p_text": extracted[j]["paragraph"], "p_num": para, "art":art}
                  data.append(dictionary)             
    
                
    
data                
df=pd.DataFrame(data)
df_concat=df.groupby(by=["Level1","art"]).agg(lambda x: ' '.join(x.astype(str))).reset_index()

df_concat.to_json("cleaned_pflichten_des_arbeitsgebers.json")
df_concat.to_csv("cleaned_pflichten_des_arbeitsgebers.csv",sep=";")
