
// import react
import moment from 'moment';
import shortid from 'shortid';
import { Button } from 'react-bootstrap';
import { View, Select } from '@dashup/ui';
import React, { useState, useEffect } from 'react';

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
    <>
      <div className="card card-sm bg-white mb-3">
        <div className="card-body d-flex flex-row">
          <div className="text-overflow flex-1">
            <b>{ props.connect.file.name }</b>
            <small className="d-block">
              Created { moment(props.connect.file.created).fromNow() }
            </small>
          </div>
          <div className="flex-0 align-items-center">
            <button className="btn btn-danger" onClick={ (e) => props.setConnect('file', null) }>
              <i className="fa fa-times" />
            </button>
          </div>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">
              Select Direction
            </label>
            <Select options={ getDirection() } value={ getDirection().filter((f) => f.selected) } onChange={ (val) => props.setConnect('direction', val?.value) } />
          </div>
          <div className="mb-3">
            <label className="form-label">
              Select Identifier Field
            </label>
            <Select options={ getIdentifier(props.getFields()) } value={ getIdentifier(props.getFields()).filter((f) => f.selected) } onChange={ (val) => props.setConnect('identifier', val?.value) } />
          </div>
          
          { !!loading || !fields ? (
            <div className="text-center">
              <i className="h1 fa fa-spinner fa-spin my-5" />
            </div>
          ) : (
            fields.map((field, i) => {
              // return jsx
              return (
                <div key={ `field-${field.key}` } className="card bg-white text-dark mb-2">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6 d-flex align-items-center">
                        <div>
                          <b>{ field.key }</b>
                          <small className="d-block">{ field.value }</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <Select options={ getField(field, props.getFields()) } value={ getField(field, props.getFields()).filter((f) => f.selected) } onChange={ (val) => onField(field, val?.value) } />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) }
          <div className="text-end">
            <Button variant="success" disabled={ syncing } onClick={ () => onSync() }>
              { syncing ? (sync ? `Synced ${sync.done} of ${sync.total}` : 'Syncing Data...') : 'Sync Data' }
            </Button>
          </div>

        </div>
      </div>
    </>
  ) : (
    <div className="card mb-3">
      <div className="card-body">
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
          onChange={ (field, value) => props.setConnect('file', value) }
        />
      </div>
    </div>
  );
};

// export default
export default ConnectCSV;