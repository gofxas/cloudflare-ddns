import requests
import schedule
import time
import os
import json

# 从配置文件中读取配置信息
with open('ddns.config.json', 'r') as config_file:
    config = json.load(config_file)

token = config['token']
zone_identifier = config['zone_identifier']
recordid = config['recordid']

saved_path = os.path.join(os.path.dirname(__file__), "savedIp")

if not os.path.exists(saved_path):
    with open(saved_path, 'w', encoding='utf-8') as f:
        f.write('')

def upload_ip():
    try:
        ipinfo = requests.get("https://api.ipify.org").text.strip()
        with open(saved_path, 'r', encoding='utf-8') as f:
            saved_ip = f.read().strip()
        
        if saved_ip and saved_ip == ipinfo:
            print("IP Has No Change! Old Ip is " + saved_ip)
        else:
            with open(saved_path, 'w', encoding='utf-8') as f:
                f.write(ipinfo)
            # IP变更 需要动态改变DNS
            print(ipinfo)
            update_dns_record(ipinfo)
    except Exception as e:
        print(e)

def update_dns_record(ip):
    link = f"https://api.cloudflare.com/client/v4/zones/{zone_identifier}/dns_records/{recordid}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    data = {
        "content": ip,
        "name": "nas",
        "proxied": False,
        "type": "A"
    }
    response = requests.put(link, headers=headers, json=data)
    result = response.json()
    if result["success"]:
        print("IP UPDATED")
    else:
        with open("err.log", "a", encoding='utf-8') as f:
            f.write(json.dumps(result["errors"]) + "\n")

def get_dns_records():
    url = f"https://api.cloudflare.com/client/v4/zones/{zone_identifier}/dns_records"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers)
    print(response.json())

# upload_ip()
# schedule.every(30).minutes.do(upload_ip)

# while True:
#     schedule.run_pending()
#     time.sleep(1)
get_dns_records()