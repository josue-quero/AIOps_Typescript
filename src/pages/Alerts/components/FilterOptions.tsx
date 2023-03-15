import { useState, useRef, forwardRef, useEffect } from "react";
import {
  Box,
  OutlinedInput,
  InputLabel,
  MenuItem,
  FormControl,
  ListItemText,
  Select,
  Checkbox,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const timeframes = [
  "",
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
};

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function FilterOptions(props) {
  const clearFilters = props.clearFilters;
  const [timeframe, setTimeframe] = useState('Last Hour');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorDate, setErrorDate] = useState(false);
  const [prevTimeframe, setPrevTimeframe] = useState('Last Hour');
  const [backupValues, setBackupValues] = useState(null);
  const [prevRangeTime, setPrevRangeTime] = useState({ startDate: '', endDate: '' });
  const [inputFields, setInputFields] = useState([
    { boolOp: 'None', Field: 'None', Operation: 'None', Value: '' }])
  const [errorFilters, setErrorFilters] = useState([
    { boolOp: false, Field: false, Operation: false, Value: false }
  ]);
  const [filterAppearences, setFilterAppearences] = useState({
    rowKey: { equality: 0, inequality: 0, count: 0 },
    Description: { equality: 0, inequality: 0, count: 0 },
    Timestamp: { equality: 0, inequality: 0, count: 0 },
    Event_Name: { equality: 0, inequality: 0, count: 0 },
    Metric_Name: { equality: 0, inequality: 0, count: 0 },
    General: { equality: 0, inequality: 0 },
    None: { equality: 0, inequality: 0, count: 0 }
  })
  const onAdvancedFilter = props.onAdvancedFilter;
  const [errorFilter, setErrorFilter] = useState(false);
  const onFilterChange = props.onFilterChange;
  const partitionKeys = props.partitionKeys;

  const [open, setOpen] = useState(false);
  const startElement = useRef();
  const endElement = useRef();

  useEffect(() => {
    if (props.openFilter) {
      setBackupValues({ inputFields: structuredClone(inputFields), errorFilters: structuredClone(errorFilters), errorFilter: structuredClone(errorFilter), timeframe: structuredClone(timeframe) });
    }
  }, [props.openFilter]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
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

  const handleCloseFilter = () => {
    props.setOpenFilter(false);
    setErrorFilters(backupValues.errorFilters);
    setErrorFilter(backupValues.errorFilter);
    setInputFields(backupValues.inputFields);
    setTimeframe(backupValues.timeframe);
  };

  const handleFormChange = (index, event, tempData) => {
    console.log("Change in filters, field, value:", event.target.name, event.target.value);
    console.log("Filter appearences", filterAppearences);
    let data = [...tempData];
    let newValue = event.target.value;
    console.log("Previous value of field", event.target.name, data[index][event.target.name]);
    let previousValue = data[index][event.target.name];
    data[index][event.target.name] = newValue;
    // We handle field changes
    if (event.target.name === "Field") {
      let tempAP = { ...filterAppearences };
      // If the old field value is not None, we change the appearence count of said value
      if (previousValue !== "None") {
        tempAP[data[index].Field].count -= 1;
        if (previousValue === "Timestamp") {
          tempAP[data[index].Field].inequality -= 1;
          tempAP.General.inequality -= 1;
        } else if (data[index].Operation !== "None") {
          if (data[index].Operation !== "==") {
            tempAP[data[index].Field].inequality -= 1;
            tempAP.General.inequality -= 1;
          } else {
            tempAP[data[index].Field].equality -= 1;
            tempAP.General.equality -= 1;
          }
        }
      }
      // If the new field value is not None, we change the appearence count of said value
      if (newValue !== "None") {
        tempAP[newValue].count += 1;
        if (newValue === "Timestamp") {
          tempAP[newValue].inequality += 1;
          tempAP.General.inequality += 1;
        } else if (data[index].Operation !== "None") {
          if (data[index].Operation !== "==") {
            tempAP[newValue].inequality += 1;
            tempAP.General.inequality += 1;
          } else {
            tempAP[newValue].equality += 1;
            tempAP.General.equality += 1;
          }
        }
      }
      setFilterAppearences(tempAP);
      // Only if there are not default values in the operation and value fields
      if (data[index].Operation !== "None" && (data[index].Operation !== "==" && tempAP.General.inequality > tempAP[newValue].inequality)) {
        handleFormChange(index, { target: { name: "Operation", value: 'None' } }, data);
      }
      if (data[index].Value !== '' && newValue === 'value') {
        console.log("Resetting value");
        handleFormChange(index, { target: { name: "Value", value: '' } }, data);
      }
    } else if (event.target.name === "Operation") {
      let tempAP = { ...filterAppearences };
      console.log("Old operation and old field", data[index].Operation, data[index].Field);
      if (previousValue !== "None") {
        if (previousValue !== "==" && data[index].Field !== "None") {
          console.log("Reducing inequality count");
          tempAP.General.inequality -= 1;
          tempAP[data[index].Field].inequality -= 1;
        } else if (data[index].Field !== "None") {
          tempAP[data[index].Field].equality -= 1;
          tempAP.General.equality -= 1;
        }
      }
      if (newValue !== "None") {
        if (newValue !== "==" && data[index].Field !== "None") {
          tempAP[data[index].Field].inequality += 1;
          tempAP.General.inequality += 1;
        } else if (data[index].Field !== "None") {
          tempAP[data[index].Field].equality += 1;
          tempAP.General.equality += 1;
        }
      }
      setFilterAppearences(tempAP);
    }
    // If the current state is error we change that status
    if (errorFilters[index][event.target.name]) {
      let tempErrors = [...errorFilters];
      tempErrors[index][event.target.name] = false;
      setErrorFilters(tempErrors);
      setErrorFilter(false);
    }
    setInputFields(data);
    console.log("New filter appearences", filterAppearences);
    console.log("New inputs", data);
  }

  const addFields = () => {
    let newfield = { boolOp: 'None', Field: 'None', Operation: 'None', Value: '' };
    let newError = { boolOp: false, Field: false, Operation: false, Value: false };
    setErrorFilters([...errorFilters, newError]);
    setInputFields([...inputFields, newfield]);
  }

  const removeFields = (index) => {
    let data = [...inputFields];
    let tempAP = { ...filterAppearences };
    tempAP[data[index].Field].count -= 1;
    if (data[index].Operation !== "None") {
      if (data[index].Operation !== "==" && data[index].Field !== "None") {
        tempAP.General.inequality -= 1;
        tempAP[data[index].Field].inequality -= 1;
      } else if (data[index].Field !== "None") {
        tempAP.General.equality -= 1;
        tempAP[data[index].Field].equality -= 1;
      }
    }
    if (data[index].Field === "Timestamp") {
      tempAP.General.inequality -= 1;
      tempAP[data[index].Field].inequality -= 1;
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
      console.log("All fields", filter, index);
      if ((((filter.Field === "None" || filter.Operation === "None") && (filter.Field !== "Timestamp")) || (filter.boolOp === "None" && index !== 0))) {
        errorDetected = true;
        tempErrors[index].Field = filter.Field === "None";
        tempErrors[index].Operation = filter.Operation === "None";
        tempErrors[index].boolOp = filter.boolOp === "None" && index !== 0;
      }
      if (filter.Field === "Timestamp") {
        if (timeframe !== "Custom") {
          const tempStartDate = dateLimits[timeframe];
          const tempEndDate = currentTime;
          tempInputFields[index].Operation = "ge datetime";
          tempInputFields[index].Value = tempStartDate.utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
          tempInputFields.push({ boolOp: "and", Field: "Timestamp", Operation: "le datetime", Value: tempEndDate.utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")})
        } else {
          const tempStartDate = moment(startDate);
          const tempEndDate = moment(endDate);
          tempInputFields[index].Operation = "ge datetime";
          tempInputFields[index].Value = tempStartDate.utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
          tempInputFields.push({ boolOp: "and", Field: "Timestamp", Operation: "le datetime", Value: tempEndDate.utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")})
        }
      }
    })
    if (errorDetected) {
      console.log("Temp errors and temp Input fields", tempErrors, tempInputFields);
      setErrorFilters(tempErrors);
      setErrorFilter(true);
    } else {
      console.log("Temp input fields", tempInputFields);
      onAdvancedFilter(tempInputFields);
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
      rowKey: { equality: 0, inequality: 0, count: 0 },
      Description: { equality: 0, inequality: 0, count: 0 },
      Timestamp: { equality: 0, inequality: 0, count: 0 },
      Event_Name: { equality: 0, inequality: 0, count: 0 },
      Metric_Name: { equality: 0, inequality: 0, count: 0 },
      General: { equality: 0, inequality: 0 },
      None: { equality: 0, inequality: 0, count: 0 }
    })
    setPrevTimeframe("Last Hour");
    setTimeframe("Last Hour");
    setErrorDate(false);
    setPrevRangeTime({ startDate: '', endDate: '' });
    setBackupValues(null);
    setStartDate('');
    setEndDate('');
    clearFilters();
    props.setOpenFilter(false);
  }

  const handleSelectTime = (event) => {
    setPrevTimeframe(timeframe);
    setTimeframe(event.target.value);
  };

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
            {'You can perform filters on all columns'}
          </DialogContentText>
          <TransitionGroup>
            {inputFields.map((input, index) => {
              return (
                <Collapse key={index}>
                  <Grid2 container direction={"row"} key={index} spacing={2} sx={{ justifyContent: "center", marginBottom: 2}}>
                    {index !== 0 ? (
                      <Grid2 sx={{ width: "100px" }}>
                        <FormControl error={errorFilters[index].boolOp}>
                          <InputLabel id="field-select">Operator</InputLabel>
                          <Select
                            labelId="field-select"
                            name="boolOp"
                            id="demo-select-small"
                            value={input.boolOp}
                            label="Operator"
                            onChange={event => handleFormChange(index, event, inputFields)}
                            sx={{ width: "90px" }}
                          >
                            <MenuItem value="None">
                              <em>None</em>
                            </MenuItem>
                            <MenuItem value="and">And</MenuItem>
                            <MenuItem value="or">Or</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid2>
                    ) : (
                      <Box sx={{ width: "100px", height: "40px" }} />
                    )}
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
                          <MenuItem value="rowKey">Alert ID</MenuItem>
                          <MenuItem value="Timestamp">Timestamp</MenuItem>
                          <MenuItem value="Description">Description</MenuItem>
                          <MenuItem value="Metric_Name">Metric</MenuItem>
                          <MenuItem value="Event_Name">Status</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                    {input.Field === "Timestamp" ? (
                      <Grid2>
                        <FormControl sx={{ width: 300 }}>
                          <InputLabel id="Timestamp-label">Timestamp</InputLabel>
                          <Select
                            labelId="Timestamp-label"
                            id="Timestamp-select"
                            name="Timestamp"
                            value={timeframe}
                            label="Timestamp"
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
                              <MenuItem value="eq">(==) equal to</MenuItem>
                              <MenuItem value="ne">(!=) not equal to</MenuItem>
                              <MenuItem value="gt">{"(>) greater than"}</MenuItem>
                              <MenuItem value="ge">{"(>=) greater than or equal to"}</MenuItem>
                              <MenuItem value="lt">{"(<) less than"}</MenuItem>
                              <MenuItem value="le">{"(<=) less than or equal to"}</MenuItem>
                            </Select>
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

export default FilterOptions;
