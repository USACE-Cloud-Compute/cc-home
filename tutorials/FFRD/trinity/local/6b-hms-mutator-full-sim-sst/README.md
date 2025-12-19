## Full Simulation SST
The purpose of this action is to generate a recordset of eventnumber, storm name, x coordinate, y coordinate, storm type, start date, basin file path. These components make up the unique events computed in HEC-HMS. It is a combination of a storm, its new transposed location, its new seasonally appropriate start time, and seasonally appropriate randomized antecedent conditions set in the basin file (a combination of POR simulated conditions and calibration parameter sets).

## Full Simulation SST Action documentation
https://github.com/USACE-Cloud-Compute/hms-mutator-plugin/blob/main/actions/full_simulation_sst.md

### Plugin Manifest
The plugin manifest for the full sim sst is functionally identical to the seed generator plugin and is documented [here](../1-blockfile-generation/README.md#plugin-manifest).  The tutorial common folder includes a plugin manifest for the hms-mutator plugin.

### Compute Manifest
The compute manifest to generate "full sim sst" is:
```json
{
  "manifest_name": "hms-mutator-full-sim-sst-trinity", //user defined.  Set this to any name you like.
  "plugin_definition": "FFRD-HMS-MUTATOR", //this must match the name from the hms-mutator-plugin-manifest
  "stores": [
    {
      "name": "FFRD", //name of the store.  This is defined by the plugin author.
      "store_type": "S3", //type of store.  S3 for this tutorial
      "profile": "FFRD", //the profile prefix that will be used to extract the environment variable configuration.
      "params": {
        "root": "model-library/ffrd-trinity" //the location on the store that all references will start from
      }
    }
  ],
  "inputs": {
    //effectively "global" level attributes for the plugin.  Any action can access these attributes
    "payload_attributes": {
      "scenario": "conformance",
      "outputroot": "simulations"
    }
  },
  "actions": [
    {
      "type": "full_simulation_sst", //the name of the action to run.  Actions are defined by the plugin author
      "name": "full_simulation_sst", //this is a legacy field. for now, set it to the same value as the name.
      "description": "sample and place storms",

      //attributes are documented in the parameter table below
      "attributes": {
        "output_data_source": "storms", 
        "storms_directory": "model-library/ffrd-trinity/conformance/storm-catalog/storms/", 
        "storms_store": "FFRD", 
        "fishnet_directory": "model-library/ffrd-trinity/conformance/storm-catalog/fishnets/", 
        "fishnet_store": "FFRD", 
        "fishnet_type_or_name": "name", 
        "storm_type_seasonality_distribution_directory": "model-library/ffrd-trinity/conformance/storm-catalog/seasonality_distributions/",
        "storm_type_seasonality_distribution_store": "FFRD",
        "basin_root_directory": "data/basinmodels",
        "basin_name": "trinity",
        "por_start_date": "20201001",
        "por_end_date": "20220930",
        "calibration_event_names": [
          "apr_may_1990",
          "aug_sep_2017",
          "dec_1991"
        ],
        "seed_datasource_key": "seeds",
        "blocks_datasource_key": "blocks"
      },
      "inputs": [
        {
          "name": "seeds", //required seeds input
          "store_name": "FFRD",
          "paths": {
            "default": "{ATTR::scenario}/{ATTR::outputroot}/seeds.json"
          }
        },
        {
          "name": "blocks", //required blocks input
          "store_name": "FFRD",
          "paths": {
            "default": "{ATTR::scenario}/{ATTR::outputroot}/blocks.json"
          }
        }
      ],
      "outputs": [
        {
          "name": "storms", //required storms output
          "paths": {
            "default": "{ATTR::scenario}/{ATTR::outputroot}/storm-catalog/storms.csv"
          },
          "store_name": "FFRD"
        }
      ]
    }
  ]
}

```

## parameterization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `output_data_source` | the name of the output datasource  | storms |
| `storms_directory` | the directory where the storms are stored as dss files | model-library/ffrd-trinity/conformance/storm-catalog/storms/ |
| `storms_store` | The name of the store that the storms directory resides within  | FFRD |
| `fishnet_directory` | The directory where the fishnets are stored as csv files | model-library/ffrd-trinity/conformance/storm-catalog/fishnets/ |
| `fishnet_store` | The name of the store that the fishnets are stored within  | FFRD |
| `fishnet_type_or_name` | How fishnets are stored type or name, if by type there would be one fishnet per storm type, if by name one fishnet by storm name | name |
| `storm_type_seasonality_distribution_directory` | The directory where storm seasonality distributions are stored  | model-library/ffrd-trinity/conformance/storm-catalog/seasonality_distributions/ |
| `storm_type_seasonality_distribution_store` | The store name where seasonality distributions are stored | FFRD |
| `basin_root_directory` | the root directory of the basin models, this is used to construct a path to a derived basin model for storage in the storms csv, this is a root directory relative to the hydrology working directory.  | data/basinmodels |
| `basin_name` | name of the hydrology basin name | trinity |
| `por_start_date` | the start date for the HMS period of record simulation performed in calibration, is used for valid date ranges for basin models | 20201001 |
| `por_end_date` | the end date for the HMS period of record simulation performed in calibration, is used for valid date ranges for basin models | 20220930 |
| `calibration_event_names` | the names of the hms calibration events (used in deriving basin names with the sampled start date and basin root directory)  | ["apr_may_1990","aug_sep_2017","dec_1991"] |
| `seed_datasource_key` | the datasource name for the seeds input datasource | seeds |
| `blocks_datasource_key` | the datasource name for the input blocks | blocks |

## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| seeds | default | conformance/simulations/seeds.json |
| blocks | default | conformance/simulations/blocks.json |


### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.

```json
{
    "name": "HMS Mutator Full Sim SST Test",
    "provider": { //this block defined the compute provider
        "type": "docker", //we will use the local docker provider
        "concurrency": 1, //we do not need to run multiple concurrent jobs, so this is set to 1
        "queue": "docker-local" //the local docker provider has a single internal queue defined as "docker-local"
    },
    "plugins": [
        "../common/hms-mutator-plugin-manifest.json" //reference to the plugin manifest
    ],
    "event": {
        "compute-manifests": [
            "compute-manifest.json" //reference to the compute manifest
        ]
    },
    
    //local docker has a simple in-memory credential management system.
    //it maps environment variables to secretsmanager key names.  
    //for example, in this configuration the env variable AWS_ACCESS_KEY_ID is mapped to a credentail manager variable of "secretsmanager:AWS_ACCESS_KEY_ID::".  subsequently, in the plugin manifest configuration, the credential manager value of "secretsmanager:AWS_ACCESS_KEY_ID::" is mapped into the running plugin as FFRD_AWS_ACCESS_KEY_ID
    "secrets-manager": {
        "type": "env",
        "secrets": {
            "secretsmanager:AWS_ACCESS_KEY_ID::": "AWS_ACCESS_KEY_ID",
            "secretsmanager:AWS_SECRET_ACCESS_KEY::": "AWS_SECRET_ACCESS_KEY"
        }
    }
}
```


### Running the plugin
to run the plugin perform the following steps
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
  3) open a command line into the `6b-hms-mutator-full-sim-sst` directory
  4) run the following command:
  ```bash
  >> cccli -e={path to your environment file} run
  ```

  for a successful run, you should see output similar to this:
    ```txt
    Compute Identifier: d367ff9c-e3ff-458b-a9fc-1680ee5e8cc4
    2025/12/19 16:23:59 SUBMITTED JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef
    2025/12/19 16:23:59 RUNNING JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef
    STARTING MONITOR FOR: 55fb14f7a9e4e7a5366e66f3fcb4662195141137ff1be6738cccde12953b1135
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.878627635Z starting the hms-mutator
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.883337801Z SDK 2025/12/19 21:23:59 WARN Response has no supported checksum. Not validating response payload.
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.909815468Z SDK 2025/12/19 21:23:59 WARN Response has no supported checksum. Not validating response payload.
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.911014218Z SDK 2025/12/19 21:23:59 WARN Response has no supported checksum. Not validating response payload.
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.912066760Z SDK 2025/12/19 21:23:59 WARN Response has no supported checksum. Not validating response payload.
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.913039385Z SDK 2025/12/19 21:23:59 WARN Response has no supported checksum. Not validating response payload.
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.913954510Z SDK 2025/12/19 21:23:59 WARN Response has no supported checksum. Not validating response payload.
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.914027676Z 2025/12/19 21:23:59 Invalid value for Attribute use_tile_db is not in the payload
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.914041760Z . Using default of: false
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.915811718Z 2025/12/19 21:23:59 Invalid value for Attribute use_tile_db is not in the payload
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.915816926Z . Using default of: false
    JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef: 2025-12-19T21:23:59.920645177Z {"time":"2025-12-19T21:23:59.92054726Z","level":"INFO","msg":"complete 100 percent"}
    2025/12/19 16:23:59 FINISHED JOB: da4a1330-9d74-4ef9-bfeb-fd1a58ad12ef
    ```