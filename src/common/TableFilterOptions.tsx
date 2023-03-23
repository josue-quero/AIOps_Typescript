import React, { useState, forwardRef } from "react";
import {
  Box,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  SelectChangeEvent,
} from "@mui/material";
import moment from 'moment-timezone';
import Slide from '@mui/material/Slide';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import Tooltip from '@mui/material/Tooltip';
import IconButton from "@mui/material/IconButton";
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import Collapse from '@mui/material/Collapse'
import { TransitionGroup } from 'react-transition-group';
import { useEffect } from "react";
import { TransitionProps } from "@mui/material/transitions";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const timeframes = [
  "Last Hour",
  "Last 24 Hours",
  "Last 7 Days",
  "Last 31 Days",
  "Last 365 Days",
  "Current Month",
  "Current Year",
  "Custom",
];

const currentTime = moment();
const dateLimits = {
  "Last Hour": moment().subtract(1, "hours"),
  "Last 24 Hours": moment().subtract(24, "hours"),
  "Last 7 Days": moment().subtract(7, "days"),
  "Last 31 Days": moment().subtract(1, "months"),
  "Last 365 Days": moment().subtract(1, "years"),
  "Current Month": moment().startOf("month"),
  "Current Year": moment().startOf("year"),
};

type DateLimits = {
  "Last Hour": moment.Moment,
  "Last 24 Hours": moment.Moment,
  "Last 7 Days": moment.Moment,
  "Last 31 Days": moment.Moment,
  "Last 365 Days": moment.Moment,
  "Current Month": moment.Moment;
  "Current Year": moment.Moment;
}

type InputField = {
  Field: string;
  Operation: string;
  Value: string | Date;
}

type FirebaseFilter = {
  Operation: string;
  Field: string;
  Value: string; 
  boolOp: boolean;
}

type ErrorFilter = {
  Field: boolean;
  Operation: boolean;
  Value: boolean;
}

type BackupValues = {
  inputFields: InputField[];
  errorFilters: ErrorFilter[];
  errorFilter: boolean;
  timeframe: string;
}

type FilterOptionsProps = {
  clearFilters: () => void;
  onAdvancedFilter: (filters: FirebaseFilter[]) => void;
  openFilter: boolean;
  setOpenFilter: React.Dispatch<React.SetStateAction<boolean>>;
};

type Filter = {
  equality: number;
  inequality: number;
  count: number;
}

interface FilterAppearences {
  Timestamp: Filter;
  rowKey: Filter;
  anomalyType: Filter;
  Server_ID: Filter;
  value: Filter;
  General: Filter;
  None: Filter;
}

const TableFilterOptions = (props: FilterOptionsProps) => {
  const [timeframe, setTimeframe] = useState('Last Hour');
  const clearFilters = props.clearFilters;
  const onAdvancedFilter = props.onAdvancedFilter;
  const [inputFields, setInputFields] = useState<InputField[]>([
    { Field: 'None', Operation: 'None', Value: '' }])
  const [errorDate, setErrorDate] = useState(false);
  const [errorFilters, setErrorFilters] = useState([
    { Field: false, Operation: false, Value: false }
  ]);
  const [errorFilter, setErrorFilter] = useState(false);
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prevTimeframe, setPrevTimeframe] = useState('Last Hour');
  const [backupValues, setBackupValues] = useState<BackupValues>({
    inputFields: [],
    errorFilters: [],
    errorFilter: false,
    timeframe: '',
  });
  const [prevRangeTime, setPrevRangeTime] = useState({ startDate: '', endDate: '' });
  const [filterAppearences, setFilterAppearences] = useState({
    Timestamp: { equality: 0, inequality: 0, count: 0 },
    rowKey: { equality: 0, inequality: 0, count: 0 },
    anomalyType: { equality: 0, inequality: 0, count: 0 },
    Server_ID: { equality: 0, inequality: 0, count: 0 },
    value: { equality: 0, inequality: 0, count: 0 },
    General: { equality: 0, inequality: 0, count: 0 },
    None: { equality: 0, inequality: 0, count: 0 }
  })

  const handleOpen = () => {
    setPrevRangeTime({ startDate: startDate, endDate: endDate });
    setOpen(true);
  };

  const handleClose = () => {
    setTimeframe(prevTimeframe);
    setOpen(false);
    setStartDate(prevRangeTime.startDate);
    setEndDate(prevRangeTime.endDate);
  };

  useEffect(() => {
    if (props.openFilter) {
      setBackupValues({ inputFields: structuredClone(inputFields), errorFilters: structuredClone(errorFilters), errorFilter: structuredClone(errorFilter), timeframe: structuredClone(timeframe) });
    }
  }, [props.openFilter]);

  const handleCloseFilter = () => {
    props.setOpenFilter(false);
    setErrorFilters(backupValues.errorFilters);
    setErrorFilter(backupValues.errorFilter);
    setInputFields(backupValues.inputFields);
    setTimeframe(backupValues.timeframe);
  };

  const handleCustomSelect = () => {
    if (startDate === '' || endDate === '') {
      setErrorDate(true);
    } else {
      setPrevTimeframe(timeframe);
      setOpen(false);
      setErrorDate(false);
    }
  }

  const handleSelectTime = (event: SelectChangeEvent<string>) => {
    setPrevTimeframe(timeframe);
    setTimeframe(event.target.value);
  };

  const handleFormChange = (index: number, event: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, tempData: InputField[]) => {
    console.log("Change in filters, field, value:", event.target.name, event.target.value);
    let data = [...tempData];
    let newValue = event.target.value;
    console.log("Previous value of field", event.target.name, data[index][event.target.name as keyof InputField]);
    let previousValue = data[index][event.target.name as keyof InputField];
    data[index][event.target.name as keyof InputField] = newValue;
    // We handle field changes
    if (event.target.name === "Field") {
      let tempAP = { ...filterAppearences };
      // If the old field value is not None, we change the appearence count of said value
      if (previousValue !== "None") {
        tempAP[data[index].Field as keyof FilterAppearences].count -= 1;
        if (previousValue === "Timestamp") {
          tempAP[data[index].Field as keyof FilterAppearences].inequality -= 1;
          tempAP.General.inequality -= 1;
        } else if (data[index].Operation !== "None") {
          if (data[index].Operation !== "==") {
            tempAP[data[index].Field as keyof FilterAppearences].inequality -= 1;
            tempAP.General.inequality -= 1;
          } else {
            tempAP[data[index].Field as keyof FilterAppearences].equality -= 1;
            tempAP.General.equality -= 1;
          }
        }
      }
      // If the new field value is not None, we change the appearence count of said value
      if (newValue !== "None") {
        tempAP[newValue as keyof FilterAppearences].count += 1;
        if (newValue === "Timestamp") {
          tempAP[newValue].inequality += 1;
          tempAP.General.inequality += 1;
        } else if (data[index].Operation !== "None") {
          if (data[index].Operation !== "==") {
            tempAP[newValue as keyof FilterAppearences].inequality += 1;
            tempAP.General.inequality += 1;
          } else {
            tempAP[newValue as keyof FilterAppearences].equality += 1;
            tempAP.General.equality += 1;
          }
        }
      }
      setFilterAppearences(tempAP);
      // Only if there are not default values in the operation and value fields
      if (data[index].Operation !== "None" && (data[index].Operation !== "==" && tempAP.General.inequality > tempAP[newValue as keyof FilterAppearences].inequality)) {
        handleFormChange(index, { target: { name: "Operation", value: 'None' } } as SelectChangeEvent<string>, data);
      }
      if (data[index].Value !== '' && newValue === 'value') {
        console.log("Resetting value");
        handleFormChange(index, { target: { name: "Value", value: '' } } as SelectChangeEvent<string>, data);
      }
    } else if (event.target.name === "Operation") {
      let tempAP = { ...filterAppearences };
      console.log("Old operation and old field", data[index].Operation, data[index].Field);
      if (previousValue !== "None") {
        if (previousValue !== "==" && data[index].Field !== "None") {
          console.log("Reducing inequality count");
          tempAP.General.inequality -= 1;
          tempAP[data[index].Field as keyof FilterAppearences].inequality -= 1;
        } else if (data[index].Field !== "None") {
          tempAP[data[index].Field as keyof FilterAppearences].equality -= 1;
          tempAP.General.equality -= 1;
        }
      }
      if (newValue !== "None") {
        if (newValue !== "==" && data[index].Field !== "None") {
          tempAP[data[index].Field as keyof FilterAppearences].inequality += 1;
          tempAP.General.inequality += 1;
        } else if (data[index].Field !== "None") {
          tempAP[data[index].Field as keyof FilterAppearences].equality += 1;
          tempAP.General.equality += 1;
        }
      }
      setFilterAppearences(tempAP);
    }
    // If the current state is error we change that status
    if (errorFilters[index][event.target.name as keyof ErrorFilter]) {
      let tempErrors = [...errorFilters];
      tempErrors[index][event.target.name as keyof ErrorFilter] = false;
      setErrorFilters(tempErrors);
      setErrorFilter(false);
    }
    setInputFields(data);
    console.log("New filter appearences", filterAppearences);
    console.log("New inputs", data);
  }

  const addFields = () => {
    let newfield = { Field: 'None', Operation: 'None', Value: '' };
    let newError = { Field: false, Operation: false, Value: false };
    setErrorFilters([...errorFilters, newError]);
    setInputFields([...inputFields, newfield]);
  }

  const removeFields = (index: number) => {
    let data = [...inputFields];
    let tempAP = { ...filterAppearences };
    tempAP[data[index].Field as keyof FilterAppearences].count -= 1;
    if (data[index].Operation !== "None") {
      if (data[index].Operation !== "==" && data[index].Field !== "None") {
        tempAP.General.inequality -= 1;
        tempAP[data[index].Field as keyof FilterAppearences].inequality -= 1;
      } else if (data[index].Field !== "None") {
        tempAP.General.equality -= 1;
        tempAP[data[index].Field as keyof FilterAppearences].equality -= 1;
      }
    }
    if (data[index].Field === "Timestamp") {
      tempAP.General.inequality -= 1;
      tempAP[data[index].Field as keyof FilterAppearences].inequality -= 1;
    }
    setFilterAppearences(tempAP);
    data.splice(index, 1);
    let error = [...errorFilters];
    error.splice(index, 1);
    setErrorFilters(error);
    setInputFields(data);
    console.log("Filter appearences after deletion of row", filterAppearences);
  }

  const handleSubAdFilter = () => {
    let errorDetected = false;
    let tempErrors = [...errorFilters];
    let tempInputFields = [...inputFields];
    inputFields.forEach((filter, index) => {
      // If any of the necessary fields are empty
      if ((filter.Field === "None" || filter.Operation === "None") && filter.Field !== "Timestamp") {
        errorDetected = true;
        tempErrors[index].Field = filter.Field === "None";
        tempErrors[index].Operation = filter.Operation === "None";
      }
      if (filter.Field === "Timestamp") {
        if (timeframe !== "Custom") {
          const tempStartDate = dateLimits[timeframe as keyof DateLimits].clone();
          const tempEndDate = currentTime.clone();
          tempInputFields[index].Operation = ">=";
          tempInputFields[index].Value = tempStartDate.toDate();
          tempInputFields.push({ Field: "Timestamp", Operation: "<=", Value: tempEndDate.toDate() })
        } else {
          const tempStartDate = moment(startDate);
          const tempEndDate = moment(endDate);
          tempInputFields[index].Operation = ">=";
          tempInputFields[index].Value = tempStartDate.toDate();
          tempInputFields.push({ Field: "Timestamp", Operation: "<=", Value: tempEndDate.toDate() })
        }
      }
    })
    if (errorDetected) {
      setErrorFilters(tempErrors);
      setErrorFilter(true);
    } else {
      console.log("Temp input fields", tempInputFields);
      onAdvancedFilter(tempInputFields as FirebaseFilter[]);
      props.setOpenFilter(false);
    }
  }

  const handleDeleteFilter = () => {
    setInputFields([
      { Field: 'None', Operation: 'None', Value: '' }]);
    setErrorFilters([
      { Field: false, Operation: false, Value: false }
    ])
    setErrorFilter(false);
    setFilterAppearences({
      Timestamp: { equality: 0, inequality: 0, count: 0 },
      rowKey: { equality: 0, inequality: 0, count: 0 },
      anomalyType: { equality: 0, inequality: 0, count: 0 },
      Server_ID: { equality: 0, inequality: 0, count: 0 },
      value: { equality: 0, inequality: 0, count: 0 },
      General: { equality: 0, inequality: 0, count: 0 },
      None: { equality: 0, inequality: 0, count: 0 }
    });
    setPrevTimeframe("Last Hour");
    setTimeframe("Last Hour");
    setErrorDate(false);
    setPrevRangeTime({ startDate: '', endDate: '' });
    setBackupValues({
      inputFields: [],
      errorFilters: [],
      errorFilter: false,
      timeframe: '',
    });
    setStartDate('');
    setEndDate('');
    clearFilters();
    props.setOpenFilter(false);
  }

  return (
    <Box sx={{ alignItems: "center", display: "flex" }}>
      <Dialog open={open} onClose={handleClose} TransitionComponent={Transition}>
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ marginBottom: 2 }}>
            Please select the start date and end date to filter for alerts.
          </DialogContentText>
          <TextField
            id="range-start"
            label="Start Date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value) }}
            sx={{ width: 250 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            id="range-end"
            label="End Date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value) }}
            sx={{ width: 250, marginLeft: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          {errorDate && (
            <DialogContentText sx={{ marginBottom: 2 }} color="error">
              Please select a valid start date and end date!
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCustomSelect} name="custom-filter">Filter</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={props.openFilter} onClose={handleCloseFilter} TransitionComponent={Transition} fullWidth={true} maxWidth={'md'}>
        <DialogTitle>Select Filters</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ marginBottom: 2 }}>
            {'You can perform range (<, <=, >, >=) or not equals (!=) comparisons only on a single field. NOTE: Timestamp counts as having a range comparison. The field that has a range or not equals comparison will be the only one where you can perform a sort operation.'}
          </DialogContentText>
          <TransitionGroup>
            {inputFields.map((input, index) => {
              return (
                <Collapse key={index}>
                  <Grid2 container direction={"row"} key={index} spacing={2} sx={{ justifyContent: "center", marginBottom: 2 }}>
                    <Grid2>
                      <FormControl error={errorFilters[index].Field}>
                        <InputLabel id="field-select">Field</InputLabel>
                        <Select
                          labelId="field-select"
                          name="Field"
                          id="demo-select-small"
                          value={input.Field}
                          label="Field"
                          onChange={event => handleFormChange(index, event, inputFields)}
                          sx={{ width: 140 }}
                        >
                          <MenuItem value="None">
                            <em>None</em>
                          </MenuItem>
                          {((filterAppearences.Timestamp.count < 1 && filterAppearences.General.inequality === 0) || (input.Field === "Timestamp" || (filterAppearences[input.Field as keyof FilterAppearences].inequality < 2 && filterAppearences[input.Field as keyof FilterAppearences].inequality === filterAppearences.General.inequality))) && (<MenuItem value="Timestamp">Timestamp</MenuItem>)}
                          <MenuItem value="rowKey">Anomally ID</MenuItem>
                          <MenuItem value="Server_ID">Server</MenuItem>
                          <MenuItem value="anomalyType">Metric</MenuItem>
                          <MenuItem value="value">Value</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                    {input.Field === "Timestamp" ? (
                      <Grid2>
                        <FormControl sx={{ width: 300 }}>
                          <InputLabel id="timestamp-label">Timestamp</InputLabel>
                          <Select
                            labelId="timestamp-label"
                            id="timestamp-select"
                            name="timeframe"
                            value={timeframe}
                            label="Timeframe"
                            onChange={handleSelectTime}
                          >
                            {timeframes.map((currTimeframe) => {
                              if (currTimeframe === "Custom") {
                                return (
                                  <MenuItem
                                    key={currTimeframe}
                                    value={currTimeframe}
                                    onClick={handleOpen}
                                  >
                                    {currTimeframe}
                                  </MenuItem>
                                );
                              }
                              return (
                                <MenuItem key={currTimeframe} value={currTimeframe}>
                                  {currTimeframe}
                                </MenuItem>
                              );

                            })}
                          </Select>
                        </FormControl>
                      </Grid2>
                    ) : (
                      <>
                        <Grid2>
                          <FormControl error={errorFilters[index].Operation}>
                            <InputLabel id="operaction-select">Operation</InputLabel>
                            {((input.Field === "None" || filterAppearences.General.inequality <= filterAppearences[input.Field as keyof FilterAppearences].inequality) || (input.Operation !== "None" && input.Operation !== "==")) ? (
                              <Select
                                labelId="operaction-select"
                                name="Operation"
                                id="demo-select-small"
                                value={input.Operation}
                                label="Operation"
                                onChange={event => handleFormChange(index, event, inputFields)}
                                sx={{ width: 140 }}
                              >
                                <MenuItem value="None">
                                  <em>None</em>
                                </MenuItem>
                                <MenuItem value="==">(==) equal to</MenuItem>
                                <MenuItem value="!=">(!=) not equal to</MenuItem>
                                <MenuItem value=">">{"(>) greater than"}</MenuItem>
                                <MenuItem value=">=">{"(>=) greater than or equal to"}</MenuItem>
                                <MenuItem value="<">{"(<) less than"}</MenuItem>
                                <MenuItem value="<=">{"(<=) less than or equal to"}</MenuItem>
                              </Select>
                            ) : (
                              <Select
                                labelId="operaction-select"
                                name="Operation"
                                id="demo-select-small"
                                value={input.Operation}
                                label="Operation"
                                onChange={event => handleFormChange(index, event, inputFields)}
                                sx={{ width: 140 }}
                              >
                                <MenuItem value="None">
                                  <em>None</em>
                                </MenuItem>
                                <MenuItem value="==">(==) equal to</MenuItem>
                              </Select>
                            )}
                          </FormControl>
                        </Grid2>
                        <Grid2>
                          {input.Field === "value" ? (
                            <TextField
                              id="outlined-name"
                              error={errorFilters[index].Value} required={false}
                              name="Value"
                              label="Value"
                              value={input.Value}
                              onChange={event => handleFormChange(index, event, inputFields)}
                              type="number"
                              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                          ) : (
                            <TextField
                              id="outlined-name"
                              error={errorFilters[index].Value} required={false}
                              name="Value"
                              label="Value"
                              value={input.Value}
                              onChange={event => handleFormChange(index, event, inputFields)}
                            />
                          )}
                        </Grid2>
                      </>
                    )}
                    <Grid2 container sx={{ alignItems: "center" }}>
                      {index !== 0 ? (
                        <Tooltip title="Remove filter" sx={{ width: "40px", height: "40px" }}>
                          <IconButton color="primary" component="label" onClick={() => removeFields(index)}>
                            <ClearIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Box sx={{ width: "40px", height: "40px" }} />
                      )}
                    </Grid2>
                  </Grid2>
                </Collapse>
              )
            })}
          </TransitionGroup>
          {inputFields.length < 15 && (
            <Grid2 container sx={{ justifyContent: "center" }}>
              <Tooltip title="Add filter">
                <IconButton color="primary" component="label" onClick={addFields}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Grid2>
          )}
          {errorFilter && (
            <DialogContentText sx={{ marginBottom: 2 }} color="error">
              Please fill the required inputs!
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteFilter}>Delete Filters</Button>
          <Button onClick={handleCloseFilter}>Cancel</Button>
          <Button onClick={handleSubAdFilter} name="custom-filter">Apply Filters</Button>
        </DialogActions>
      </Dialog >
    </Box >
  );
};

export default TableFilterOptions;