# read tree ring chronology data files and write them to JSON
import urllib.request
import json
import os
import time

import matplotlib.pyplot as plt
from bs4 import BeautifulSoup

import json
import matplotlib.pyplot as plt
import numpy as np
from scipy.interpolate import UnivariateSpline

def process_timeseries():
    root_dir = "C:/Users/Jacob/Projects/data_itrdb"
    data_file = "C:/Users/Jacob/Projects/data_itrdb/itrdb_chronology_data.txt"
    crn_json = {}
    rwl_json = {}
    corr_json = {}
    
    errorsfile = open(os.path.join(root_dir, "timeseries_errors.txt"), "w")
    in_file = open(data_file)
    line = in_file.readline()
    line = in_file.readline()
    count = 0
    while line != "":
        line = line.strip().split(",")
        site_id = line[0]
        data_urls = []
        for n in [1,16,31,46,61,76]:
            if n < len(line):
                data_urls.append(line[n])
        for f in data_urls:
            basename = os.path.basename(f)
            if f == " " or f == "":
                continue
            else:
                try:
                    with urllib.request.urlopen(f) as url:
                        html_doc = url.read()
                        soup = BeautifulSoup(html_doc, 'html.parser')
                    try:
                        if f[-4:] == ".crn":
                            read_crn(soup, crn_json, basename)
                        elif f[-4:] == ".txt":
                            read_correlation_stats(soup, corr_json, basename)
                        elif f[-4:] == ".rwl":
                            read_rwl(soup, rwl_json, basename)
                    except:
                        errorsfile.write(str(f) + "\n")
                except:
                    print("cannot open: " + str(f))
        count+=1
        print(count)
        line = in_file.readline()
    # dump the jsons. chyeah boiiiyiyyyyyy!!
    errorsfile.close()
    with open('./itrdb_crn_data.json', 'w') as outfile:
        json.dump(crn_json, outfile)
    with open('./itrdb_rwl_data.json', 'w') as outfile:
        json.dump(rwl_json, outfile)
    with open('./itrdb_corr_data.json', 'w') as outfile:
        json.dump(corr_json, outfile)

    
def read_crn(soup, in_json, basename):
    """
    basename here is the basename of the url data file that is contained in the paleodata file
    {
     basenameA: [[values], [samples], [start_year, end_year]],
     basenameB: [[values], [samples], [start_year, end_year]]
    }
    
    """
    # processed according to: ftp://ftp.ncdc.noaa.gov/pub/data/paleo/treering/treeinfo.txt
    # there are three common flavors, sitecodeR.crn, sitecodeA.crn, and sitecode.crn
    if basename not in in_json:
        in_json[basename] = [[basename],["sample number"],[]]
    conts = soup.contents
    if len(conts[0].split("\r\n")) == 1:
        conts = conts[0].split("\n")
    else:
        conts = conts[0].split("\r\n")
    # start at the third line, because most .crn have three lines of header?
    record = 0
    missing_value = 9990
    start = False
    while record < len(conts) and conts[record] != "":
        if record == 0:
            siteid = conts[record][0:6].strip()
        elif record == 1:
            start_year = conts[record][67:71]
            end_year = conts[record][72:76]
            in_json[basename][2] = [int(start_year), int(end_year)]
            countyear = int(start_year)
        elif record == 2:
            pass
        else:
            # process the file
            idx = 10
            while idx < 80:
                val = conts[record][idx:idx+4].strip()
                if val != "9990":
                    if start == False: # do this funny business to catch when to begin counting years.
                        start = True
                    countyear+=1
                    samp_num = conts[record][idx+4:idx+7].strip()
                    in_json[basename][0].append(float(val))
                    if samp_num != "":
                        in_json[basename][1].append(int(samp_num))
                    else:
                        in_json[basename][1].append(None)
                else:
                    if start: # there might be gaps in the chronology, so we still need to count the years in gaps
                        countyear+=1
                idx+=7
                if countyear >= int(end_year):
                    idx=80
        record+=1
    
def read_correlation_stats(soup, in_json, basename):
    """
    basenameA: {seriesIntercorrelation: val,
                avgmeansens: val,
                }
    """
    if basename not in in_json:
        in_json[basename] = {}
    conts = soup.contents
    conts = conts[0].split("\n")
    fields = {"Series intercorrelation":"serICorr",
              "Avg mean sensitivity":"avgMeanSens",
              "Avg standard deviation":"avgStd",
              "Avg autocorrelation":"avgAutoCorr",
              "Number dated series":"nSeries",
              "Number problem segments":"nProbSeg",
              "Pct problem segments":"pctProbSeg",
              "Segment length tested":"segLenTest"}
    line = 0
    done = False
    while line < len(conts) and not done:
        dataline = conts[line].split(":")
        if dataline[0].strip() in fields:
            in_json[basename][fields[dataline[0].strip()]] = dataline[1].strip()
        if len(in_json[basename]) == 8:
            done = True
        line+=1
    
def read_rwl(soup, in_json, basename):
    """
    {
     basenameA: {treecore1: [[values], [start_year, end_year]], treecore2: [[values], [start_year, end_year]]},
     basenameB: {treecore2: [[values], [start_year, end_year]], treecore2: [[values], [start_year, end_year]]}
    }
    """
    # processed according to: ftp://ftp.ncdc.noaa.gov/pub/data/paleo/treering/treeinfo.txt
    # there are three common flavors, sitecodeR.crn, sitecodeA.crn, and sitecode.crn
    if basename not in in_json:
        in_json[basename] = {}
    conts = soup.contents
    conts = conts[0].split("\r\n")
    record = 0
    while record < len(conts) and conts[record] != "":
        if record == 0:
            siteid = conts[record][0:6].strip()
        elif record == 1:
            pass
            """start_year = conts[record][67:71]
            end_year = conts[record][72:76]
            in_json[basename][2] = [int(start_year), int(end_year)]"""
        elif record == 2:
            pass
        else:
            tree_core_id = conts[record][:6]
            if tree_core_id not in in_json[basename]:
                year = int(conts[record][8:12].strip())
                in_json[basename][tree_core_id] = [[tree_core_id],["year"]]
                count = 0
            # process the file
            idx = 12
            while idx < 73:
                val = conts[record][idx:idx+6].strip()
                if val != "" and val != '-9999' and val != '999':
                    in_json[basename][tree_core_id][0].append(float(val))
                    in_json[basename][tree_core_id][1].append(year+count)
                    count+=1
                elif val == '-9999' or val == '999':
                    in_json[basename][tree_core_id][0].append(None)
                    in_json[basename][tree_core_id][1].append(year+count)
                    count+=1
                idx+=6
        record+=1
        
process_timeseries()

plt.figure(figsize=(15,5))
plt.grid()
plt.plot(out['wv003.rwl']['033011'][1][1:], out['wv003.rwl']['033011'][0][1:])
plt.plot(out['wv003.rwl']['010021'][1][1:], out['wv003.rwl']['010021'][0][1:])
plt.show()

contents = open("C:/Users/Jacob/Projects/itrdb/data/itrdb_crn_data.json")
contents = contents.read()
data = json.loads(contents)

with open('./test.json', 'w') as outfile:
        json.dump(new_j, outfile)
        
contents = open("C:/Users/Jacob/Projects/itrdb/python/test.json")
contents = contents.read()
data = json.loads(contents)
data

plt.figure(figsize=(15,6))
count = 0
for t in data['wv003.rwl']:
    x = data['wv003.rwl'][t][1][1:-1]
    y = np.array(data['wv003.rwl'][t][0][1:-1])
    s = UnivariateSpline(x, y, s=1)
    xs = np.linspace(data['wv003.rwl'][t][1][1],data['wv003.rwl'][t][1][-2], 1000)
    ys = s(xs)
    plt.plot(x, y, '.-')
    plt.plot(xs, ys)
    count+=1
    if count == 4:
        break
plt.show()


from numpy import linspace,exp
from numpy.random import randn
import matplotlib.pyplot as plt
from scipy.interpolate import UnivariateSpline
x = linspace(-3, 3, 100)
y = exp(-x**2) + randn(100)/10
s = UnivariateSpline(x, y, s=1)
xs = linspace(-3, 3, 1000)
ys = s(xs)
plt.plot(x, y, '.-')
plt.plot(xs, ys)
plt.show()