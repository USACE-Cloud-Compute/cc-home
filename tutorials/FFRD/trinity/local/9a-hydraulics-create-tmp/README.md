## Create TMP
The purpose of this is to remove the results block from HDF files uploaded remotely. HEC-RAS cannot compute on an HDF file containing a results block. This step should be done every time a modeler uploads an HEC-RAS model remotely, and should be done prior to starting any computes. It should not be done as an action with a compute when many events are being computed because it will be pulling a full results block into each container and represents a massive amount of unnecessary data transfer.

## Usage Notes
This manifest is very generic and needed by all HDF plan results files for any project using HEC-RAS. The only changing parameter is typically the Model Prefix. The tutorial uses the "per-event-loop" to push out multiple jobs pointing at the same manifest with different environment variables for the "MODEL_PREFIX" environment varialbe to reduce duplication of manifests.

## Relevant Actions documentation
https://github.com/USACE/cc-ras-runner/blob/main/actions/utils/copy-inputs-action.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/utils/create-ras-tmp.md


## parametrization for the tutorial

```json
{
    "plugin_definition": "CC-RAS-PLUGIN",//this must match from the RAS plugin registration manifest.
    "manifest_name": "create-tmp",//user defined.
    "stores": [
        {
            "name": "FFRD",//a name for the store, used by data sources to reference a store.
            "store_type": "S3",//the type of store, S3 meaning Simple Storage System. For the local tutorial we are using minio to mock out S3.
            "profile": "FFRD",//the profile for the store, used to find environment variables to support secret management.
            "params": {
                "root": "model-library/ffrd-trinity"//the root of the store which will be prepended to any path defined in a datasource referencing this store.
            }
        }
    ],
    "inputs": {//payload level "global" inputs.
        "payload_attributes": {//payload level "global" attributes.
            "base-hydraulics-directory": "hydraulics",//an attribute to support substitution for the directory where hydraulics data is stored.
            "modelPrefix": "{ENV::MODEL_PREFIX}",//an attribute named modelPrefix that is being set by an environment variable named MODEL_PREFIX that is being used for substitution for each model area. This MODEL_PREFIX variable will be set via the compute.json using the perEventLoop feature. It represents the name of a ras model unit. By making the attribute this way, we are able to create a single manifest that shold work for all basins for all time in FFRD.
            "plan": "01",//the plan name, while the FFRD SOP requires a plan name of 01, other users may want to use other plan numbers, so we have put it in the attributes to make substitution easy for other purposes.
            "scenario": "conformance"//the scenario is an attribute that defines a portion of the path to the plan file we are deleting results from. For FFRD, there are two primary scenarios, conformance and production. By making this an attribute, it is a simple change from one scenario to another without updating all paths in the manifest.
        },
        "data_sources": [//"global" input datasources.
            {
                "name": "{ATTR::modelPrefix}.p{ATTR::plan}.hdf",//the model unit plan hdf file we want to delete results from.
                "paths": {
                    "0": "{ATTR::scenario}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix}/{ATTR::modelPrefix}.p{ATTR::plan}.hdf"//the path where the hdf file lives (relative to the FFRD root of /model-library/ffrd-trinity)
                },
                "store_name": "FFRD"//the store name from the stores in the payload that the datasource lives within.
            }
        ]
    },
    "outputs": [//global outputs.
        {
            "name": "{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf",//the destination plan name
            "paths": {
                "0": "{ATTR::scenario}/{ATTR::base-hydraulics-directory}/{ATTR::modelPrefix}/{ATTR::modelPrefix}.p{ATTR::plan}.hdf"//the destination plan path. notice the hdf path is the same as the input path, with S3 this will be a get object, mutate object, put object, so it will overwrite the old object with the change defined by the actions below.
            },
            "store_name": "FFRD"//the store name where the output will be put.
        }
    ],
    "actions": [//action list. these will operate in order.
        {
            "name": "copy-inputs",//the action name copy-inputs will copy all global inputs.
            "description": "copy-files",//a description.
            "type": "utils"//a type.
        },
        {
            "name": "create-ras-tmp",//the action name create-ras-temp will take an hdf file and "remove" the Results block from the hdf file by creating a new hdf locally and only copying over blocks that are not named "Results" since hdf does not have an easy way to fully remove deleted blocks. 
            "description": "removing results from hdf file",//a description.
            "type": "utils",// a type.
            "attributes": {//action level attributes (the scope of these is only for the action, global attributes scope is global.)
                "local_dest": "{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf",//the local hdf file that will be created and pushed.
                "remote_dest": "{ATTR::modelPrefix}.p{ATTR::plan}.tmp.hdf",//the name used in the global output datasources to identify which output datasource to use (that datasource has a path and a store name to know where to put it.)
                "save_to_remote": "true",//a boolean that will tell the action to push to remote rather than simply remove the results. If this is set to false, it should be followed by a "compute" or additional mutations. We find it is handy to have this as a stand alone action since we plan to run computes many times, by doing this upfront we only copy results into the container one time (not many times) and remove them once (not many times.)
                "src": "{ATTR::modelPrefix}.p{ATTR::plan}.hdf"//the local file name after the copy-inputs action completes.
            }
        }
    ]
}
```


# copy-inputs
| Attribute | Description | Value |
|-----------|----------|-------------|
| not applicable | |

# create-ras-tmp
| Attribute | Description | Value |
|-----------|----------|-------------|
| `src` | the pathname of the hdf file to be converted (copied in with a copy action) | clear-creek.p01.hdf |
| `local_dest` | the local file name to create | clear-creek.p01.tmp.hdf |
| `remote_dest` | the name of the datasource in the remote output destination | clear-creek.p01.tmp.hdf |
| `save_to_remote` | a flag to indicate that the hdf file should be saved to remote as part of the action execution | true |

## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| clear-creek.p01.hdf | 0 | /conformance/hydraulics/clear-creek/clear-creek.p01.hdf |
