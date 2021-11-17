
// import react
import moment from 'moment';
import shortid from 'shortid';
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Stack, View, TextField, MenuItem, Card, CardContent, CardHeader, Typography, LoadingButton, CardActions } from '@dashup/ui';

// connect sheets
const ConnectCSV = (props = {}) => {
  // state
  const [sync, setSync] = useState(null);
  const [fields, setFields] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const [loading, setLoading] = useState(false);

  // on sync
  const onSync = async () => {
    // pull
    setSyncing(true);

    // sync
    await props.dashup.action({
      type   : 'connect',
      struct : 'csv',
    }, 'sync', props.connect, {
      page  : props.page.get('_id'),
      form  : props.getForms()[0] ? props.getForms()[0].get('_id') : null,
      model : props.page.get('data.model') || props.page.get('_id'),
    });

    // reload
    props.page.emit('reload');

    // pull
    setSyncing(false);
  };

  // on field
  const onField = (field, value) => {
    // get fields
    const fields = props.connect.fields || {};

    // set value
    fields[value] = field.key;

    // on conect
    props.setConnect('fields', fields);
  };

  // get field
  const getField = (field, fields) => {
    // return value
    return [...(fields)].map((f) => {
      // return fields
      return {
        label    : f.label || f.name,
        value    : f.uuid,
        selected : (props.connect.fields || {})[f.uuid] === field.key,
      };
    });
  };

  // get direction
  const getDirection = () => {
    // return value
    return [['Both Ways', 'both'], ['CSV => Dashup only', 'sheets'], ['Dashup => CSV', 'dashup']].map((sync) => {
      // return channel
      return {
        label    : sync[0],
        value    : sync[1],
        selected : props.connect.direction === sync[1],
      };
    });
  };

  // get identifier
  const getIdentifier = (fields) => {
    // keys
    return Object.keys(props.connect.fields || {}).map((uuid) => {
      // get field
      const field = fields.find((f) => f.uuid === uuid);

      // return
      return field ? {
        label    : `${field.label || field.name} === ${props.connect.fields[uuid]}`,
        value    : field.uuid,
        selected : props.connect.identifier === field.uuid,
      } : null;
    }).filter((f) => f);
  };

  // use effect
  useEffect(() => {
    // check file
    if (!props.connect.file) return;

    // action
    props.dashup.action({
      type   : 'connect',
      struct : 'csv',
    }, 'fields', props.connect, {}).then(setFields);

    // sync
    props.dashup.socket.on(`connect.${props.connect.uuid}`, setSync);

    // remove listeners
    return () => {
      // remove listener
      props.dashup.socket.removeListener(`connect.${props.connect.uuid}`, setSync);
    };
  }, [props.connect.file])

  // return jsx
  return props.connect.file ? (
    <Card variant="outlined" sx={ {
      mt : 2,
    } }>
      <CardHeader
        title={ props.connect.file?.name }
        subtitle={ `Created ${moment(props.connect.file.created).fromNow()}` }
      />
      <CardContent>
        <TextField
          value={ props.connect.direction || '' }
          label="Direction"
          onChange={ (e) => props.setConnect('direction', e.target.value) }
          select
          fullWidth
        >
          { getDirection().map((option) => {
            // return jsx
            return (
              <MenuItem key={ option.value } value={ option.value }>
                { option.label }
              </MenuItem>
            )
          }) }
        </TextField>
        <TextField
          value={ props.connect.identifier || '' }
          label="Identifier"
          onChange={ (e) => props.setConnect('identifier', e.target.value) }
          select
          fullWidth
        >
          { getIdentifier(props.getFields()).map((option) => {
            // return jsx
            return (
              <MenuItem key={ option.value } value={ option.value }>
                { option.label }
              </MenuItem>
            )
          }) }
        </TextField>
        
        { (loading || !fields) ? (
          <Box py={ 2 } alignItems="center" justifyContent="center" display="flex">
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={ 2 } sx={ {
            mt : 2,
          } }>
            { fields.map((field, i) => {
              // return jsx
              return (
                <Card variant="outlined" key={ field.key }>
                  <CardContent sx={ {
                    display       : 'flex',
                    alignItems    : 'center',
                    flexDirection : 'row',
                  } }>
                    <Box>
                      <Typography sx={ {
                        fontWeight : 'bold',
                      } }>
                        { field.key }
                      </Typography>
                      <Typography sx={ {
                        fontSize : 'small',
                      } }>
                        { field.value }
                      </Typography>
                    </Box>
                    
                    <TextField
                      value={ getField(field, props.getFields()).find((f) => f.selected)?.value || '' }
                      label={ field.key }
                      onChange={ (e) => onField(field, e.target.value) }
                      select
                      sx={ {
                        ml       : 'auto',
                        minWidth : '50%',
                      } }
                    >
                      { getField(field, props.getFields()).map((option) => {
                        // return jsx
                        return (
                          <MenuItem key={ option.value } value={ option.value }>
                            { option.label }
                          </MenuItem>
                        )
                      }) }
                    </TextField>
                  </CardContent>
                </Card>
              );
            }) }
          </Stack>
        ) }
      </CardContent>
      <CardActions sx={ {
        justifyContent : 'end',
      } }>
        <LoadingButton color="success" variant="contained" disabled={ !!syncing } loading={ !!syncing } onClick={ () => onSync() }>
          { syncing ? (sync ? `Synced ${sync.done} of ${sync.total}` : 'Syncing Data...') : 'Sync Data' }
        </LoadingButton>
      </CardActions>
    </Card>
  ) : (
    <View
      type="field"
      view="input"
      struct="file"

      field={ {
        uuid   : shortid(),
        label  : 'CSV File',
        accept : '.csv',
      } }
      value={ props.connect.file }
      dashup={ props.dashup }
      onChange={ (field, value) => props.setConnect('file', value && value[0]) }
    />
  );
};

// export default
export default ConnectCSV;