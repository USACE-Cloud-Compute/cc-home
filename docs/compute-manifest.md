# Anatomy of a compute manifest

A compute manifest represents the configuration for one or more computes (a.k.a. "jobs") that will run on the compute provider.  It containes the information necessary to extecute the compute (variables required by the plugin), what actions to run during the compute, connections to remote data stores and data sources or outputs that will be used to retrieve or transfer data during the run.  Additionally it can be used to override some of the attributes confgured for the plugin manifest such as resource requirements, timeout values, or retry requirements.  The json file has the following sections:

| Attribute | Description |
|-----------|----------|
| `manifest_name` | the name of the manifest |
| `plugin_definition` | the name of the registered plugin manifest.  In AWS batch this would be the plugin manifest name and the revision in the following format `{plugin_name}:{plugin_revision}`  For example "MY_PLUGIN:4".  When using the local docer environment, the revision is uneccesary and the format is simply `{plugin_name}` or "MY_PLUGIN" for the example.|
| `command` | optional command parameters override array.  If this is included the compute provider will run this command rather than the one registered for the plugin or built into the docker image |
| `dependencies` | this is an array of dependencies within an event that must be sucessfully completed for this job to run.  Any dependency failure will cause the dependent job to also fail.  Dependencies are defined as the file name of the dependent compute manifest.  for example `dependencies:[compute_manifest1.json,../anotherjob/compute_manifest2.json]`
| `stores` | stores is an array of data stores that will be used to read/write data while the plugin is running.  Stores are defined using a stores block format (refer to stores below).  Stores can be of any storage type from file systems to databases, however, several store types are native to cloud compute.  These are S3 for AWS S3 compatible stores and FS for mounted file system stores.  New stores types can be created by plugin authors and registered at runtime by the plugin.  Additional documentation on stores and development of new stores is <<here>>
| `inputs` | the inputs section includes multiple forms of input.  These include payload_attributes, input data_sources, additional environment variables, and additional parameters that can be added to the command.  These are discussed in detail in the inputs section below. |
| `outputs` | the outputs section consists of an array of output data_sources. Data sources and their configuration options are discussed <<here>> |
| `actions` | the actions section consists of an array of actions.  Actions and their configuration options are defined <<here>> |
| `tags` | tags consist of an object of key value pairs.  Tags do not affect compute but will be passed to the compute provider if it support [tags](https://docs.aws.amazon.com/batch/latest/userguide/using-tags.html) |
| `retry_attempts` | optional integer representing the number of times a plugin will retry if it fails.  default is 0 which is no retry |
| `job_timeout` | optional timout in seconds.  If a running plugin exceeds this duration, it will be terminated. the default null or empty value is equivalent to no timeout |
| `resource_requirements` | resource requirements overrrides for the compute.  These are defined in a key/value format documented <<below>> |


### Stores
Stores provide an integrated and consistant way to define and connect to remote data sources.  The store configuration format for a plugin manifest is:
| Attribute | Description |
|-----------|----------|
| `name` | this is the name of the store and how it will be referenced from a cloud compute plugin SDK |
| `store_type` | this is a string representing the type of the store.  Cloiud compute includes "S3" and "FS" for AWS S3 compatible and File System stores respecitvely |
| `profile` | this is a string prefix that is used to deliniate environment variables for the store.  For example the profile of "MYSTORE" would be used to look up an environment variable of "MYSTORE_AWS_REGION" when makign a connection to a S3 store|
| `params` | the parameters object is effectively a dictionary of parameters that can be used by a store |

a sample store configuration for both S3 and a FS is:
```json
"stores": [
    {
        "name":      "MYS3STORE",
        "store_type": "S3",
        "profile": "MYSTORE",
        "params": {
            "root": "/prefix1/prefix2"
        }
    },
    {
        "name": "LOCAL",
        "store_type": "FS",
        "params": {
            "root": "/home/mydir"
        }
    }
],
```
In this example please note that the local store is based on a mount and therefore does not need to actively create a connection client.  Consequently it does not need a `profile` to get connection parameters for the store.


### Inputs
There are four configuration options for inputs:
  1) `environment`: This is the configuration of environment variables that will be injected into the running container.  The configuration consists of a list of object key value pairs with `name` mapping to the name of the environment variable, and `value` mapping to the value. An example environment configuration is:
  ```json
    "environment":[
        {
            "name":  "AWS_REGION",
            "value": "us-east-1"
        },
        {
            "name":  "AWS_VIRTUAL_HOSTING",
            "value": "FALSE"
        }
    ],
  ```
  2) `parameters`: Additional parameters passed to the job that replace parameter substitution placeholders set in the plugin manifest `command` attribute. Parameters map to the substitution placeholder name, for example to susbstitute the value 1 for the placeholder "Ref::param1", you would configure parameters like this:
  ```json
    "parameters": {
        "param1": 1
    }
  ```
  3) `data_sources`: an array of data_source objects
  4) `payload_attributes`: an object of key value pairs with the key being the attribute name and the value being the attribute value.  Payload attributes can nest arrays and additional objects as values.

A sample input is included below:
```json
"inputs":{
    "environment": [
        {
            "name":  "MY_ENV_VAL",
            "value": "42"
        }
    ]
    "parameters": {
        "param1": 1
    },
    "payload_attributes":{
        "modelPrefix": "bardwell-creek",
        "plan": "01"
    },
    "data_sources":[
        {
            "name": "rasOutput",
            "paths": {
                "default": "mymodel/mymodel.p01.hdf"
            },
            "store_name": "FFRD"
        }
    ]
},
```


### Data Source
A data source is one or more resources that are referenced from a single data store.  A Data source consists of files or any external reference that will be used as input or output for the compute job. Data Sources are highly flexible and can contain both resource paths and internal data paths.  A data source has the following attributes:
| Attribute | Description |
|-----------|----------|
| `name` | this is the name of the source and how it will be referenced from a cloud compute plugin SDK |
| `paths` | a data source has a required paths object.  The paths object can have any number of attributes which consist of a key (name) and a value (resource path).  If the data store that is referenced from the data source contains a "root" parameter, the `paths` will be relative paths from the data store root.
| `data_paths` | a data source also has an optional data_paths object.  Similar to paths, the data_paths is can have any number of attributes which consist of a key (name) and a value (resource path). In effect, the `path` describes the location of a resource within a data store, and the data_path describes the location of the dataset within the resource if it is a multiple dataset format.  For example the path can refer to a hdf5 file on an external store, whereas the data_path would refer to a single dataset within the hdf5 file.
| `store_name` | the name of the store that contains the data sources

A typical sample data source configuration for a single file is:

```json
{
    "name": "rasOutput",
    "paths": {
        "default": "mymodel/run1/mymodel.p01.hdf"
    },
    "store_name": "FFRD"
}
```

### Actions
Actions define what functionality will be executed in a plugin.  Plugins can execute multiple tasks, for instance a plugin might have an action to prepare data for a model, then another action to run the model.  The actions configuration lets the user construct a compute manifest that can execute one or more of the plugin actions to maximize flexibility.  Actions are configured as an array of action objects, and will be execute sequentially by ordinal position in the array (first in, first executed, last in, last executed).  Actions have the following properties:
| Attribute | Description |
|-----------|----------|
| `name` | this is the required name of the action that will be executed.  The plugin defines the list of available actions |
| `type` | this is a required legecy field that for now should be set to the same value as the name |
| `description` | the description for the specific action compute |
| `attributes` | an object of key value pairs with the key being the attribute name and the value being the attribute value. these are qequivalent to payload attributes, but are private to the action |
| `stores` | array of data stores |
| `inputs` | array of data source inputs |
| `outputs` | array of data sourc outputs |

a simple example set of actions that copies inputs then performs an extraction operation on the data copied is:
```json
"actions":[
    {
        "name": "copy-inputs",
        "type": "util",
        "description": "copy hdf5 ras output into the container for extraction"
    },
    {
        "name": "ras-extract",
        "type": "extract",
        "description": "boundary condition peak flow and stage",
        "attributes": {
            "outputformat":"json"
        }
    }
]
```

### Resource Requirements
Resource requirements are included as an array of resource objects.  A resource object contains the following attributes:
| Attribute | Description |
|-----------|----------|
| `resource_type` | string for the kind of resource that will be set |
| `value` | the value that will be set |

currently virtual CPUs (VCPU) and memory (MEMORY) in mb can be set in the compute manifest. Values set in the compute manifest will override default resource requirements set in the plugin manifest.  An example configuration is:

```json
"resource_requirements":[
    {
        "resource_type":  "VCPU",
        "value": "2"
    },
    {
        "resource_type":  "MEMORY",
        "value": "2000"
    }
]
```
--------
Compute manifest substitution and substitution rules

