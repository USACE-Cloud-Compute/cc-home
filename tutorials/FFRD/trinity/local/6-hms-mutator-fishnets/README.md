## Fishnets
A fishnet is a file of coordinate points that are typically rectangularly placed at even intervals. This action takes a storm which has an original centering, a transposition domain that defines the possible new centerings, and the study area which is used to determine if the proposed centering results in any grid cell over the study area is null for the storm. The result is a series of evenly spaced x and y coordinates for a given storm that represent valid placements of that storm. This compute can happen after creation of the storm catalog, but before the generation of an SST Storms table.
This action requires a catalog.grid file, a watershed boundary geopackage, and a transposition domain geopackage. These files are the input to (watershed boundary and transposition domain) and output of the storm catalog generation process.
This process will create a list of valid storm locations for each storm in the catalog.grid file as a csv. These storm fishnet csvs will be used by the next action.

## Fishnets Action documentation
https://github.com/USACE-Cloud-Compute/hms-mutator-plugin/blob/main/actions/stratifiedlocations.md

### Plugin Manifest
The plugin manifest for the fragility curve is functionally identical to the seed generator plugin and is documented [here](../1-blockfile-generation/README.md#plugin-manifest).  The tutorial common folder includes a plugin manifest for the hms-mutator plugin.

### Compute Manifest
The compute manifest to generate "fishnets" is:
```json
{
  "manifest_name": "hms-mutator-fishnets-trinity", //user defined.  Set this to any name you like.
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
    "payload_attributes": { //effectively "global" level attributes for the plugin.  Any action can access these attributes
      "scenario": "conformance",
      "outputroot": "simulations"
    },
    "data_sources": [
      {
        "name": "HMS Model",  //required input for the HMS model (refer to fishnets action documentation for details)
        "paths": {
          "grid": "{ATTR::scenario}/storm-catalog/catalog.grid"
        },
        "store_name": "FFRD"
      },
      {
        "name": "TranspositionRegion", //required transposition region geopackage dataset (refer to fishnets action documentation for details)
        "paths": {
          "default": "{ATTR::scenario}/storm-catalog/transposition-domain.gpkg"
        },
        "store_name": "FFRD"
      },
      {
        "name": "WatershedBoundary", //required watershed boundary geopackage (refer to fishnets action documentation for details)
        "paths": {
          "default": "{ATTR::scenario}/storm-catalog/watershed-boundary.gpkg"
        },
        "store_name": "FFRD"
      },
      {
        "name": "seeds", //required seeds input (refer to fishnets action documentation for details)
        "paths": {
          "default": "{ATTR::scenario}/{ATTR::outputroot}/seeds.json" 
        },
        "store_name": "FFRD"
      }
    ]
  },
  "outputs": [
    {
      "name": "ValidLocations", //ouput folder location
      "paths": {
        "default": "{ATTR::scenario}/storm-catalog/fishnets" 
      },
      "store_name": "FFRD"
    }
  ],
  "actions": [
    {
      "name": "valid_stratified_locations", //the name of the action to run.  Actions are defined by the plugin author
      "type": "valid_stratified_locations", //this is a legacy field. for now, set it to the same value as the name.
      "description": "create stratified fishnets for storms",
      "attributes": {
        "_comment": "4km in meters",
        "spacing": 4000,
        "acceptance_threshold": 0.0
      }
    }
  ]
}
```

## parametrization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `spacing` | the spacing in meters for points  | 4000 |

## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| HMS Model | grid  | conformance/storm-catalog/catalog.grid |
| TranspositionRegion | default | conformance/storm-catalog/transposition-domain.gpkg |
| WatershedBoundary | default | conformance/storm-catalog/watershed-boundary.gpkg |

### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.

```json
{
    "name": "HMS Mutator Fishnets Test",
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
  3) open a command line into the `6-hms-mutator-fishnets` directory
  4) run the following command:
  ```bash
  >> cccli -e={path to your environment file} run
  ```

  for a successful run, you should see output similar to this:
  ```txt
    Compute Identifier: 0116979e-05ea-42f2-bfe4-f18f9e4a38b0
    2025/12/19 15:22:40 SUBMITTED JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0
    2025/12/19 15:22:40 RUNNING JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0
    STARTING MONITOR FOR: 21e906ad80e13fc5ee90dd57c8f2bcd305d47cbc813ad8ebda5cd8c155420820
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:40.908551834Z starting the hms-mutator
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:40.918647543Z SDK 2025/12/19 20:22:40 WARN Response has no supported checksum. Not validating response payload.
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:40.921405001Z SDK 2025/12/19 20:22:40 WARN Response has no supported checksum. Not validating response payload.
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:40.922505834Z SDK 2025/12/19 20:22:40 WARN Response has no supported checksum. Not validating response payload.
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:40.925416334Z SDK 2025/12/19 20:22:40 WARN Response has no supported checksum. Not validating response payload.
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:40.955703001Z determining potential placements
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:41.706387335Z determined 57497 potential placements
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:41.708451543Z working on storm 20160309_72hr_ST5_r001
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:41.708586876Z working on storm 20080901_72hr_ST2_r002
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:41.709490501Z working on storm 19910427_72hr_ST1_r006
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:41.709504251Z working on storm 20170826_72hr_ST2_r004
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:41.709797418Z working on storm 20151023_72hr_ST1_r003
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:41.709832793Z working on storm 19951003_72hr_ST2_r005
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:22:41.709841335Z working on storm 20011127_72hr_ST1_r007
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:52:31.324239719Z found 1410 valid placements for storm 20151023_72hr_ST1_r003
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:52:31.334000219Z 20151023_72hr_ST1_r003.csv took 1789.618233482 seconds
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:52:43.635452419Z found 1947 valid placements for storm 20170826_72hr_ST2_r004
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:52:43.642590627Z 20170826_72hr_ST2_r004.csv took 1801.926690779 seconds
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:53:28.322885884Z found 4033 valid placements for storm 20080901_72hr_ST2_r002
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:53:28.335196384Z 20080901_72hr_ST2_r002.csv took 1846.621482175 seconds
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:05.817134346Z found 4874 valid placements for storm 20011127_72hr_ST1_r007
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:05.829212096Z 20011127_72hr_ST1_r007.csv took 1884.112897609 seconds
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:11.316237293Z found 4418 valid placements for storm 19910427_72hr_ST1_r006
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:11.324560543Z 19910427_72hr_ST1_r006.csv took 1889.60835511 seconds
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:12.918071460Z found 3274 valid placements for storm 20160309_72hr_ST5_r001
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:12.924153169Z 20160309_72hr_ST5_r001.csv took 1891.208956444 seconds
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.050229803Z found 6069 valid placements for storm 19951003_72hr_ST2_r005
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058908178Z 19951003_72hr_ST2_r005.csv took 1910.342593453 seconds
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058922719Z 20160309_72hr_ST5_r001,329720.7394211,1.061020987096e+06
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058925136Z 20080901_72hr_ST2_r002,422363.5517861689,1.0128687412249808e+06
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058926636Z 19910427_72hr_ST1_r006,473661.84768467775,1.108505286932423e+06
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058927844Z 20170826_72hr_ST2_r004,41851.62684534305,721363.4552944076
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058928886Z 20151023_72hr_ST1_r003,-43976.12622321788,999264.3941761961
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058938053Z 19951003_72hr_ST2_r005,985517.3283390825,1.0723932619169254e+06
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058939136Z 20011127_72hr_ST1_r007,515020.66848476074,1.196568660381177e+06
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.058940011Z 
    JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0: 2025-12-19T20:54:32.061382844Z {"time":"2025-12-19T20:54:32.061301219Z","level":"INFO","msg":"complete 100 percent"}
    2025/12/19 15:54:32 FINISHED JOB: 93aab57c-c0f6-445d-9ba4-2798f0de0da0
  ```