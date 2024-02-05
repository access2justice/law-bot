# Law Bot Data
The test data is currently based on https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de

# Run the data scripts
First, open the data project (the `\data` folder) in your IDE and open a terminal window within the IDE. 

Second, make sure to prepare your env:  
1. Install packages:  
`pip install -r requirements.txt`
2. Create an .env file, using the .env.example as a boilerplate
3. Generate data by running:
`python Read_pflichten_des_arbeitsgebers.py`


Third, run the following commands:
0. Create Azure index (optional):  
`python create_azure_index.py`
1. Upload Pflichten des Arbeitsgebers dataset to Azure:
`python upload_index_data.py`
 

