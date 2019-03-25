# CS4470 Library Capacity Capstone: Elasticsearch to MongoDB FaaS

Uses IBM Cloud functions / Apache OpenWhisk to fetch data from elasticsearch every 5 minutes and insert it into MongoDB.

How to upload to IBM Cloud Functions:

```
zip -r action.zip *
```

```
ibmcloud fn action create ACTION_NAME action.zip --kind nodejs:10
```

More info:
https://console.bluemix.net/docs/openwhisk/openwhisk_actions.html#openwhisk_js_packaged_action

