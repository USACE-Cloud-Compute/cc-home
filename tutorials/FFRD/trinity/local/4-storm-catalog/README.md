## Storm Catalog generation
The process of generating the storm catalog requires a watershed domain and a transposition domain. The plugin retrieves meterologic data (precipitation and temperature) for storms that maximize the cumulative preciptiation over the watershed domain from any location within the transposition domain over the user provided time range.

For this tutorial the inputs generate a small catalog for a short time window to illustrate the use of the tool. The sample data for the tutorial includes a subset catalog from the real catalog for trinity to control the overall tutorial durations, so the output generated from this step is not actually used by any subsequent steps directly.

## Action documentation
This plugin currently has no actions, it simply runs one fixed sequence of processes from [main](https://github.com/USACE-Cloud-Compute/storm-cloud-plugin/blob/main/cc/main.py).

### Plugin Manifest
The plugin manifest for the fragility curve is functionally identical to the previous plugins and is documented [here](../1-blockfile-generation/README.md#plugin-manifest).  The tutorial common folder includes a plugin manifest for the storm-cloud-plugin.

### Compute Manifest
Next we need a [compute manifest](https://github.com/USACE-Cloud-Compute/cc-home/blob/main/docs/compute-manifest.md) to define the actual compute job variables and actions.  Referring to the "compute-manifest.json" for this tutorial run,  we will need the folowing:

```json
{
    "manifest_name":     "stormhub",//a user provided name
    "plugin_definition": "STORMHUB",//the plugin definition name from the plugin manifest
    "stores": [
        {
            "name": "FFRD",//the store name
            "store_type": "S3",//the store type S3 Simple Storage System which is being mocked by minio in this tutorial
            "profile": "FFRD",//the store profile used to find secrets for authorization
            "params": {
                "root": "/model-library/ffrd-trinity"//the root of the store.
            }
        }
    ],
    "inputs":{//global inputs
      "payload_attributes": {//global attributes.
            "catalog_id": "data",//an id for the catalog
            "catalog_description": "Storm Catalog Description",//a description for the catalog.
            "start_date": "2022-11-02",//a start date for the catalog. (typically this would be the start of the entire period of record)
            "end_date": "2022-12-01",//an end date for the catalog (typically this would be the end entire period of record)
            "storm_duration": 72,//storm duration (can be different durations follow SOP guidance)
            "min_precip_threshold": 0,//typically 0.
            "top_n_events": 1,//typically related to the number of years in the catalog times the average storm occurance rate (arrival rate) over the transposition. So for 44 years of record with 10 storms on average per year over the transposition domain we would see 44*10 or 440 storms.
            "check_every_n_hours": 12,//a parameter to define how frequently to start the algorithm to scan for storms across the basin with the watershed over the target duration. typically this would be something like 6 hours. this parameter increases the overall compute time of the process and was increased to reduce compute time for the tutorial. 
            "specific_dates": [],
            "input_path": "conformance/storm-catalog",//an attribute used for subsitution to define the input data root directory relative to the store root.
            "output_path": "conformance/storm-catalog/generated-outputs"//an attribute used for subsitution to define the output data root directory relative to the store root. note the added "generated-outputs" key partition to put the catalog not in the root of the storm-catalog key so that we dont corrupt the tutorial base data.
      },
      "data_sources": [{
            "name": "StormHubInputs",//the name of the data source.
            "paths": {
                "watershed": "{ATTR::input_path}/watershed-boundary.geojson",//the watershed boundary. 
                "transposition": "{ATTR::input_path}/transposition-domain.geojson"//the transposition domain.
            },
            "data_paths": {},
            "store_name": "FFRD"
    }]
    },
    "outputs": [],
    "actions": []
}

```
### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.

```json
{
    "name": "Storm Hub Test",
    "provider": { //this block defined the compute provider
        "type": "docker", //we will use the local docker provider
        "concurrency": 1, //we do not need to run multiple concurrent jobs, so this is set to 1
        "queue": "docker-local" //the local docker provider has a single internal queue defined as "docker-local"
    },
    "plugins": [
        "../common/storm-cloud-plugin-manifest.json" //reference to the plugin manifest
    ],
    "event": {
        "compute-manifests": [
            "storm-cloud-compute-manifest.json" //reference to the compute manifest
        ]
    },
    
    //local docker has a simple in-memory credential management system.
    //it maps environment variables to secretsmanager key names.  
    //for example, in this configuration the env variable AWS_ACCESS_KEY_ID is mapped to a credentail manager variable of "secretsmanager:AWS_ACCESS_KEY_ID::".  subsequently, in the plugin manifest configuration, the credential manager value of "secretsmanager:AWS_ACCESS_KEY_ID::" is mapped into the running plugin as FFRD_AWS_ACCESS_KEY_ID. Notice however, that the CC_AWS_ACCESS_KEY_ID is separated in this compute file, therefore an additional entry is required in the plugin manifest credential manager for the CC_AWS_ACCESS_KEY_ID allowing the credentials for the CC Store to be separate from the overall FFRD store if a user wanted to separate permissions like that.
    "secrets-manager": {
        "type": "env",
        "secrets": {
            "secretsmanager:CC_AWS_ACCESS_KEY_ID::":"CC_AWS_ACCESS_KEY_ID",
            "secretsmanager:CC_AWS_SECRET_ACCESS_KEY::":"CC_AWS_SECRET_ACCESS_KEY",
            "secretsmanager:FFRD_AWS_ACCESS_KEY_ID::":"AWS_ACCESS_KEY_ID",
            "secretsmanager:FFRD_AWS_SECRET_ACCESS_KEY::":"AWS_SECRET_ACCESS_KEY"
        }
    }
}
```


### Running the storm-cloud-plugin
to run the storm-cloud-plugin perform the following steps
  1) make sure you have set up your local stores and copied the starting set of trinity files into your ffrd store
  2) create an environment file to run local docker compute.  The file must have the following elements:
     ```bash
        CC_AWS_ACCESS_KEY_ID={Minio AccessKey}
        CC_AWS_SECRET_ACCESS_KEY={Minio SecretKey}
        CC_AWS_DEFAULT_REGION=us-east-1
        CC_AWS_S3_BUCKET={cc store bucket name}
        CC_AWS_ENDPOINT={minio local endpoint.  Typically "http://localhost:9000"}
        AWS_ACCESS_KEY_ID={Minio AccessKey}
        AWS_SECRET_ACCESS_KEY={Minio SecretKey}
        CC_ROOT=cc_store
     ```
  3) open a command line into the `4-storm-catalog` directory
  4) run the following command:
  ```bash
  >> ../../cccli -e={path to your environment file} run
  ```
  for a successful run, you should see output similar to this:
  ```txt
    /////////add////////////this//////text/////////
  ```