## Basin Record Generation
The process of basin record generation relies on the POR HMS simulation and the calibration events performed during the calibration phase. This process puts together the anticedent conditons. This defines the basin characteristics for each day of the year based on the POR simulation with the calibrated parameter sets for the model, yeilding a combination of n parameter sets with m days in the por simulation (e.g. `6*44*365`).

This manifest uses Attribute Array substitution. This is a useful system for substituting an array of values across pathnames for special use cases. Here the paths get expanded to match the values of the basin_models array, so from one path in the datasources for "basin" we will generate 3 total resolved paths, one for each calibration basin model. This reduces the verbosity of input and outputs in this manifest. The annotation for the attribute expansion is {ATTR::basin_models[]} where an attribute that is a primitive array is referenced with brackets. A specific value can be referenced or the entire array can be referenced.

## Relevenat Action documentation
https://github.com/USACE-Cloud-Compute/basin-record-gen-plugin/blob/main/src/actions/hot_start_processing_function.md

## parametrization for the tutorial
| Attribute | Description | Value |
|-----------|----------|-------------|
| `por_run_name` | The name of the POR simulation  | por
| `basin_models` | The name of the Calibration basin models | ["trinity_apr_may_1990","trinity_aug_sep_2017","trinity_dec_1991"]
| `start_date` | The start date for the process within the POR simulation time range  | 2020-10-01T00:00:00.008Z
| `end_date` | The end date for the process within the POR simulation | "2022-09-30T00:00:00.008Z"
| `event_duration_hours` | The duration of the event to input into the control specification  | 72
| `lookback_duration_hours` | The lookback duration (coordinated with ressim) | 0
| `end_padding_hours` | Hours to add on the end of the control specification to ensure travel time for the event  | 768


## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| ScenarioFiles-calibration | por-dss  | ffrd-trinity/calibration/hydrology-por/por.dss
| ScenarioFiles-calibration | basin-trinity_apr_may_1990  | ffrd-trinity/calibration/hydrology/trinity_apr_may_1990.basin
| ConformanceFiles | control  | ffrd-trinity/conformance/hydrology/SST.control

