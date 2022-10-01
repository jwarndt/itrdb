import urllib.request
import json
import os

from bs4 import BeautifulSoup

root_path = "https://www1.ncdc.noaa.gov/pub/data/metadata/published/paleo/json"
feature_collection = {"type":"FeatureCollection",
                      "features": []}
files = []
with urllib.request.urlopen(root_path) as url:
    html_doc = url.read()
    soup = BeautifulSoup(html_doc, 'html.parser')
conts = soup.body.table.contents

for line in conts:
    if line != '\n':
        fname = line.get_text()
        if "tree" in fname:
            record_name = fname[:fname.index('.json')] + ".json"
            full_path = root_path + "/" + record_name
            with urllib.request.urlopen(full_path) as url:
                json_doc_string = url.read()
                json_doc = json.loads(json_doc_string)
            orig_file = full_path
            try:
                study_id  = json_doc["NOAAStudyId"]
                study_code = json_doc["studyCode"]
                resource = json_doc['onlineResourceLink']
                doi = json_doc["doi"]
                investigators = json_doc["investigators"]
                site_coords = json_doc['site'][0]['geo']['geometry']['coordinates']
                full_data = json_doc['site'][0]['paleoData']
                site_name = json_doc['site'][0]['siteName']
                common_species = json_doc['site'][0]['paleoData'][0]['species'][0]['commonName']
                scientific_species = json_doc['site'][0]['paleoData'][0]['species'][0]['scientificName']
                code_species = json_doc['site'][0]['paleoData'][0]['species'][0]['speciesCode']
                earliest_date = json_doc['site'][0]['paleoData'][0]['earliestYear']
                most_recent_date = json_doc['site'][0]['paleoData'][0]['mostRecentYear']
                
                geojson = {"type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [site_coords[1], site_coords[0]]
                              },
                          "properties": {
                              "orig_filename": orig_file,
                              "study_ID": study_id,
                              "doi": doi,
                              "investigators": investigators,
                              "lat": site_coords[0],
                              "lon": site_coords[1],
                              "site_name": site_name,
                              "species_name_com": common_species,
                              "species_name_sci": scientific_species,
                              "species_code": code_species,
                              "earliest_year": earliest_date,
                              "most_recent_year": most_recent_date,
                              "data": full_data,
                              "study_code": study_code,
                              "noaa_online_resource_page": resource
                              }
                        }
                feature_collection["features"].append(geojson)
            except IndexError:
                print(full_path)
# do json encoding
with open('./itrdb.geojson', 'w') as outfile:
    json.dump(feature_collection, outfile)


root_path = "https://www1.ncdc.noaa.gov/pub/data/metadata/published/paleo/json"
feature_collection = {"type":"FeatureCollection",
                      "features": []}
files = []
with urllib.request.urlopen(root_path) as url:
    html_doc = url.read()
    soup = BeautifulSoup(html_doc, 'html.parser')
conts = soup.body.table.contents

output_data_table_name = "C:/Users/Jacob/Projects/itrdb/itrdb_chronology_data.txt"
data_table_file = open(output_data_table_name, "w")
data_table_file.write("site_id")
data_file_thresh = 7
var_thresh = 3
for i in range(data_file_thresh): # 7 is arbitrary, (an assumption) I can't see there being more than 10 data files associated with a single site??
    num  = "0" + str(i)
    data_table_file.write(",u_"+num+", u_"+num+"_desc, u_"+num+"_keyword")
    for v in range(var_thresh): # 3 is arbitrary, I can't see there being more than 3 variables
        v_num = "0" + str(v)
        data_table_file.write(", v_"+num+"_"+v_num+"_desc, v_"+num+"_"+v_num+"_meth, v_"+num+"_"+v_num+"_det, v_"+num+"_"+v_num+"_unit")
data_table_file.write("\n")

for line in conts:
    if line != '\n':
        fname = line.get_text()
        if "tree" in fname:
            record_name = fname[:fname.index('.json')] + ".json"
            full_path = root_path + "/" + record_name
            with urllib.request.urlopen(full_path) as url:
                json_doc_string = url.read()
                json_doc = json.loads(json_doc_string)
            orig_file = full_path
            try:
                study_id  = json_doc["NOAAStudyId"]
                
                # getting paleoData
                data_table_file.write(study_id)
                whole_line = ""
                n = 0
                while n < len(json_doc['site'][0]['paleoData'][0]['dataFile']):
                    data_url = json_doc['site'][0]['paleoData'][0]['dataFile'][n]["fileUrl"]
                    data_desc = json_doc['site'][0]['paleoData'][0]['dataFile'][n]["urlDescription"]
                    keyword = json_doc['site'][0]['paleoData'][0]['dataFile'][n]["NOAAKeywords"][0].split(">")[-1]
                    file_str = "," + data_url + "," + data_desc + "," + keyword
                    var_str = ""
                    v = 0
                    while v < len(json_doc['site'][0]['paleoData'][0]['dataFile'][n]["variables"]):
                        var_desc = str(json_doc['site'][0]['paleoData'][0]['dataFile'][n]["variables"][v]["cvWhat"].split(">")[-1])
                        var_meth = str(json_doc['site'][0]['paleoData'][0]['dataFile'][n]["variables"][v]["cvMethod"])
                        var_det = str(json_doc['site'][0]['paleoData'][0]['dataFile'][n]["variables"][v]["cvDetail"])
                        var_unit = str(json_doc['site'][0]['paleoData'][0]['dataFile'][n]["variables"][v]["cvUnit"])
                        if var_desc == "null" or var_desc == None or var_desc == "None":
                            var_desc = ""
                        if var_meth == "null" or var_meth == None or var_meth == "None":
                            var_meth = ""
                        if var_det == "null" or var_det == None or var_det == "None":
                            var_det = ""
                        if var_unit == "null" or var_unit == None or var_unit == "None":
                            var_unit = ""
                        var_str += "," + var_desc + "," + var_meth + "," + var_det + "," + var_unit
                        v+=1
                    if v < var_thresh: # if didn't get enough variables to fill the row
                        extras_v = ", , , , "
                        extras_v*=(var_thresh - v)
                        var_str += extras_v
                    whole_line+=file_str + var_str
                    n+=1
                if n < data_file_thresh:
                    extras = ", , , , , , , "
                    extras*=(data_file_thresh - n)
                whole_line+=extras
                data_table_file.write(whole_line + "\n")
            except IndexError:
                print(full_path)

import json

from osgeo import ogr
from osgeo import osr

def geojson_to_shapefile(input_filename, output_filename):
    contents = open(input_filename)
    contents = contents.read()
    data = json.loads(contents)
    
    # set up the shapefile driver
    driver = ogr.GetDriverByName("ESRI Shapefile")
    # create the data source
    data_source = driver.CreateDataSource(output_filename)
    # create the spatial reference, WGS84
    srs = osr.SpatialReference()
    srs.ImportFromEPSG(4326)
    # create the layer
    layer = data_source.CreateLayer("itrdb", srs, ogr.wkbPoint)
    
    studyId = ogr.FieldDefn("studyID", ogr.OFTString)
    studyId.SetWidth(20)
    layer.CreateField(studyId)
    f = ogr.FieldDefn("filename", ogr.OFTString)
    f.SetWidth(100)
    layer.CreateField(f)
    d = ogr.FieldDefn("doi", ogr.OFTString)
    d.SetWidth(100)
    layer.CreateField(d)
    i = ogr.FieldDefn("invstgtrs", ogr.OFTString)
    i.SetWidth(150)
    layer.CreateField(i)
    layer.CreateField(ogr.FieldDefn("lat", ogr.OFTReal))
    layer.CreateField(ogr.FieldDefn("lon", ogr.OFTReal))
    sn = ogr.FieldDefn("sitename", ogr.OFTString)
    sn.SetWidth(150)
    layer.CreateField(sn)
    spc = ogr.FieldDefn("sppCom", ogr.OFTString)
    spc.SetWidth(150)
    layer.CreateField(spc)
    sps = ogr.FieldDefn("sppSci", ogr.OFTString)
    sps.SetWidth(150)
    layer.CreateField(sps)
    scode = ogr.FieldDefn("sppCode", ogr.OFTString)
    scode.SetWidth(10)
    layer.CreateField(scode)
    layer.CreateField(ogr.FieldDefn("earliest", ogr.OFTInteger))
    layer.CreateField(ogr.FieldDefn("mostRecent", ogr.OFTInteger))
    studycode = ogr.FieldDefn("studyCode", ogr.OFTString)
    studycode.SetWidth(20)
    layer.CreateField(studycode)
    noaap = ogr.FieldDefn("noaaPage", ogr.OFTString)
    noaap.SetWidth(150)
    layer.CreateField(noaap)

    n = 0
    while n < len(data['features']):
        # create the feature
        feature = ogr.Feature(layer.GetLayerDefn())
        
        # Set the attributes using the values from the delimited text file
        feature.SetField("studyID", data['features'][n]['properties']["study_ID"])
        feature.SetField("filename", data['features'][n]['properties']["orig_filename"])
        feature.SetField("doi", data['features'][n]['properties']["doi"])
        feature.SetField("invstgtrs", data['features'][n]['properties']["investigators"])
        feature.SetField("lat", float(data['features'][n]['properties']["lat"]))
        feature.SetField("lon", float(data['features'][n]['properties']["lon"]))
        feature.SetField("sitename", data['features'][n]['properties']["site_name"])
        feature.SetField("sppCom", data['features'][n]['properties']["species_name_com"][0])
        feature.SetField("sppSci", data['features'][n]['properties']["species_name_sci"])
        feature.SetField("sppCode", data['features'][n]['properties']["species_code"])
        feature.SetField("earliest", int(data['features'][n]['properties']["earliest_year"]))
        feature.SetField("mostRecent", int(data['features'][n]['properties']["most_recent_year"]))
        feature.SetField("studyCode", data['features'][n]['properties']["study_code"])
        feature.SetField("noaaPage", data['features'][n]['properties']["noaa_online_resource_page"])

        point = ogr.Geometry(ogr.wkbPoint)
        point.AddPoint(float(data['features'][n]['geometry']['coordinates'][0]), float(data['features'][n]['geometry']['coordinates'][1]))

        # Set the feature geometry using the polygon
        feature.SetGeometry(point)

        # Create the feature in the layer (shapefile)
        layer.CreateFeature(feature)

        # Dereference the feature
        feature = None
        n+=1
    data_source = None