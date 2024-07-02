const schedule = require("node-schedule");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { token, zone_identifier, identifier, recordid } = require("./ddns.config.js");

const savedPath = path.join(__dirname, "savedIp");

if (!fs.existsSync(savedPath)) {
  fs.writeFileSync(savedPath, "", {
    encoding: "utf8",
  });
}
const uploadIp = async () => {
  try {
    const ipinfo = await axios.get("https://api.ipify.org/");
    const savedIP = fs.readFileSync(savedPath, {
      encoding: "utf8",
    });
    const ip = ipinfo.data.replace(/\s|\n/gi, "");
    if (savedIP && savedIP == ip) {
      console.log("IP Has No Change! Old Ip is " + savedIP);
    } else {
      fs.writeFileSync(savedPath, ip, {
        encoding: "utf8",
      });
      // IP变更 需要动态改变DNS
      console.log(ip);
      updateDnsRecord(ip);
    }
  } catch (e) {
    console.log(e);
  }
};

const updateDnsRecord = async (ip) => {
  const link = `https://api.cloudflare.com/client/v4/zones/${zone_identifier}/dns_records/${recordid}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  const data = {
    content: ip,
    name: "nas",
    proxied: false,
    type: "A",
  };
  const put = await axios.put(link, data, config);
  if (put.data.success) {
    console.log("IP UPDATED");
  } else {
    fs.appendFileSync("err.log", JSON.stringify(put.data.errors) + "\n");
  }
};

const getDnsRecords = async () => {
  const url = `https://api.cloudflare.com/client/v4/zones/${zone_identifier}/dns_records`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  const get = await axios.get(url, config);
  console.log(get.data)
};

// uploadIp();
// schedule.scheduleJob("0 0,30 * * * *", () => {
//   uploadIp();
// });

getDnsRecords()