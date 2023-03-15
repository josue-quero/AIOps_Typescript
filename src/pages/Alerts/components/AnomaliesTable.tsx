import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableContainer,
  TablePagination,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  TableHead,
} from "@mui/material";
import PropTypes from 'prop-types';
import { Circle as CircleIcon } from '@mui/icons-material';
import EnhancedTableToolbar from './EnhancedTableToolbar.jsx';
import { styled } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import FilterOptions from './FilterOptions';

const importanceIcons = {
  OK: '#1976d2',
  WARNING: '#f5ce64',
  CRITICAL: '#f7584d',
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#6aa0f7",
    color: theme.palette.common.white,
    fontFamily: `Oswald, sans-serif`,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    fontFamily: `Oswald, sans-serif`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

function Row(props) {
  const { row } = props;

  return (
    <React.Fragment>
      <StyledTableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <StyledTableCell component="th" scope="row">
          <p className="result-text-modal">{row.partitionKey}</p>
        </StyledTableCell>
        <StyledTableCell align="left" sx={{ margin: 0 }}><p className="result-text-modal">{row.timestamp}</p></StyledTableCell>
        <StyledTableCell align="left"><p className="result-text-modal">{row.description}</p></StyledTableCell>
        <StyledTableCell align="left"><p className="result-text-modal">{row.metric}</p></StyledTableCell>
        <StyledTableCell align='center'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span style={{ width: 80 }}>{row.status} </span>
            <CircleIcon
              sx={{
                fontSize: '1.2rem',
                marginLeft: '4px',
                color: importanceIcons[row.status],
              }}
            />
          </div>
        </StyledTableCell>
      </StyledTableRow>
    </React.Fragment>
  );
}

Row.propTypes = {
  row: PropTypes.shape({
    partitionKey: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    metric: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
};

export default function EnhancedTable(props) {
  const [filterOptions, setFilterOptions] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  let emptyRows = 0;
  if (((page + 1) * rowsPerPage) > props.rows.length) {
    emptyRows = ((page + 1) * rowsPerPage) - props.rows.length;
  }

  console.log("Current empty rows", emptyRows);
  // ---------------- HANDLERS ---------------

  const handleChangePage = (event, newPage) => {
    console.log("Page to", newPage);
    let newStart = newPage * rowsPerPage;
    console.log("Start from", newStart);
    console.log("Original start", props.start);
    // The new page is above current data
    if (newStart > (props.start - 1)) {
      console.log("Next page");
      props.onNextPage();
    }
    setPage(newPage);
  };

  useEffect(() => {
    console.log("Current start and docsperquery and page", props.start, props.docsPerQuery, page);
    if (props.start === props.docsPerQuery && page > 0) {
      console.log("Resetting page");
      setPage(0);
    }
  }, [props.rows])

  const handleChangeRowsPerPage = (event) => {
    setPage(parseInt(((page * rowsPerPage) / event.target.value), 10));
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  // const handleFilterChange = (event) => {
  //   setFilterSettings((previousFilters) => ({
  //     ...previousFilters,
  //     [event.target.name]: event.target.value,
  //   }));
  // };

  // const handleDateChange = (val, lower, upper) => {
  //   setFilterSettings((previousFilters) => ({
  //     ...previousFilters,
  //     timeframe: val,
  //     lowerLimit: lower,
  //     upperLimit: upper,
  //   }));
  // };

  // Avoid a layout jump when reaching the last page with empty rows.

  const handleHideOptions = () => {
    setFilterOptions((prev) => !prev);
  }

  return (
    <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
      <EnhancedTableToolbar filterOptions={filterOptions} handleHideOptions={handleHideOptions} handleDownload={props.handleDownloadAll} title={'Alerts'}/>
      <FilterOptions clearFilters={props.clearFilters} onAdvancedFilter={props.onAdvancedFilter} openFilter={filterOptions} setOpenFilter={setFilterOptions} />
      <TableContainer sx={{ maxHeight: "78vh" }}>
        <Table stickyHeader sx={{ maxHeight: "78vh", height: "78vh" }} aria-label="customized pagination table">
          <TableHead>
            <TableRow>
              <StyledTableCell align="left">
                Alert ID
              </StyledTableCell>
              <StyledTableCell align="left">
                Timestamp
              </StyledTableCell>
              <StyledTableCell align="left">
                Description
              </StyledTableCell>
              <StyledTableCell align="left">
                Metric
              </StyledTableCell>
              <StyledTableCell align="center">
                Status
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!props.isLoading ? (
              <>
                {(rowsPerPage > 0 ? props.rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : props.rows).map((row, index) => (
                  <Row key={index} row={row} />
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 68 * emptyRows }}>
                    <TableCell colSpan={5} />
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow >
                <TableCell sx={{ textAlign: "center" }} colSpan={5}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 30]}
        component='div'
        count={props.rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        nextIconButtonProps={
          true &&
          {
            // disabled: emptyRows > 0 ? true : false
            disabled: props.disableNextButton && (((page + 1) * rowsPerPage) >= props.rows.length)
          }
        }
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} of ${`${count} currently cached items`}`}
      />
    </Paper>
  );
}