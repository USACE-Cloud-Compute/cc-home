## Seed Generation
The process of generating seeds ensures reproducability if recomputes are ever required. Seeds are generated based on the blockfile structure, user provided inital seeds, and a set of plugin names that will be consuming the seed sets.

## Seed Generation Action documentation
https://github.com/USACE-Cloud-Compute/seed-generator-plugin/blob/main/internal/actions/block-all-seed-generation-action.md

### Plugin Manifest
The creation of a plugin manifest for the seed generator plugin is documented [here](../1-blockfile-generation/README.md#plugin-manifest).

### Compute Manifest
We need a compute manifest to define the actual compute job variables and actions. Referring to the "compute-manifest.json" for this tutorial run, we will need the folowing:

```json
{

    "manifest_name": "seed-generation", //user defined.  Set this to any name you like.
    "plugin_definition": "FFRD-SEED-GENERATOR",  //this must match the name from the seed-generator-plugin-manifest
    "stores": [
        {
            "name": "FFRD", //name of the store.  This is defined by the plugin author.
            "store_type": "S3", //type of store.  S3 for this tutorial
            "profile": "FFRD", //the profile prefix that will be used to extract the environment variable configuration.
            "params": {
                "root": "/model-library/ffrd-trinity" //the location on the store that all references will start from
            }
        }
    ],
	"actions": [
		{
			"name": "block-all-seed-generation",  //the name of the action to run.  Actions are defined by the plugin author
			"type": "block-all-seed-generation", //this is a legacy field. for now, set it to the same value as the name.
			"description": "generating seeds by blocks for all events in a simulation", //a user defined description for the run
			"attributes": { //seed generation action parameters are defined in the parameter block below
				"block_dataset_name": "blocks.json",
				"block_store_type": "json",
				"seed_dataset_name": "seeds.json",
				"seed_store_type": "json",
				"initial_event_seed": 8855534638979991142,
				"initial_block_seed": 7715454204949210629,
				"initial_realization_seed": 8380661580462607644,
				"plugins": [
					"fragilitycurveplugin",
					"hms-mutator",
					"hms-runner",
					"ressim-runner",
					"consequences_clear-creek",
					"consequences_lewisville",
					"consequences_ray-roberts"
				]
			},
			"inputs": [
				{
					"name": "blocks.json", //the name of the input data source.  This is defined by the plugin author
					"paths": {
						"default": "conformance/simulations/blocks.json" //the path to the input location relative to the store root.
					},
					"store_name": "FFRD"
				}
			],
			"outputs": [
				{
					"name": "seeds.json", //the name of the outout data source.  This is defined by the plugin author
					"paths": {
						"default": "conformance/simulations/seeds.json" //the path to the output location relative to the store root.
					},
					"store_name": "FFRD" //the store that will be used to write the output
				}
			]
		}
	]
}
```


## parametrization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `initial_event_seed` | Starting seed value for event-level randomization | 8855534638979991142
| `initial_block_seed` | Starting seed value for block-level randomization | 7715454204949210629
| `initial_realization_seed` | Starting seed value for realization-level randomization | 8380661580462607644
| `plugins` | List of plugin names that will receive seeds | see compute-manifest for list
| `block_dataset_name` | Name of the input dataset containing blocks | blocks.json
| `block_store_type` | Storage type for input blocks ("eventstore" or "file") | json
| `seed_dataset_name` | Name of the output dataset for seeds | seeds.json
| `seed_store_type` | Storage type for output seeds ("eventstore" or "file") | json


### Compute file
The compute file effectively links the plugin manifest, compute manifest and compute provider together.

```json
{
    "name": "Seed Generation Test",
    "provider": { //this block defined the compute provider
        "type": "docker", //we will use the local docker provider
        "concurrency": 1, //we do not need to run multiple concurrent jobs, so this is set to 1
        "queue": "docker-local" //the local docker provider has a single internal queue defined as "docker-local"
    },
    "plugins": [
        "../common/seed-generator-plugin-manifest.json" //reference to the plugin manifest
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


### Running the seed generation
to run the seed generation perform the following steps
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
  3) open a command line into the `1-blockfile-generation` directory
  4) run the following command:
  ```bash
  >> cccli -e={path to your environment file} run
  ```
  
  for a successful run, you should see output similar to this:
  ```txt
    Compute Identifier: b1a08492-f4e3-441a-bd64-47dfb3df8596
    2025/12/19 13:42:17 SUBMITTED JOB: 78a56304-9faa-4ec9-9b60-908b74731811
    2025/12/19 13:42:18 RUNNING JOB: 78a56304-9faa-4ec9-9b60-908b74731811
    STARTING MONITOR FOR: cf09dc4a75b01161fe6212b18ad7f7333a5ed28e5bf67b70feb23392e0aa3cde
    JOB: 78a56304-9faa-4ec9-9b60-908b74731811: 2025-12-19T18:42:18.096043005Z SDK 2025/12/19 18:42:18 WARN Response has no supported checksum. Not validating response payload.
    JOB: 78a56304-9faa-4ec9-9b60-908b74731811: 2025-12-19T18:42:18.096151672Z {"time":"2025-12-19T18:42:18.096104297Z","level":"INFO","msg":"Seed Generator","version":"v1.0.5-0-gdcd5fc0","build-date":"2025-11-10T18:27:06Z"}
    JOB: 78a56304-9faa-4ec9-9b60-908b74731811: 2025-12-19T18:42:18.096155713Z {"time":"2025-12-19T18:42:18.096122463Z","level":"INFO","msg":"Running block-all-seed-generation"}
    JOB: 78a56304-9faa-4ec9-9b60-908b74731811: 2025-12-19T18:42:18.102838255Z {"time":"2025-12-19T18:42:18.102729172Z","level":"INFO","msg":"Completed block-all-seed-generation"}
    2025/12/19 13:42:18 FINISHED JOB: 78a56304-9faa-4ec9-9b60-908b74731811
  ```