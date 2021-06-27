
// import connect interface;
import got from 'got';
import chunk from 'chunk';
import * as csv from '@fast-csv/parse';
import { Struct, Query, Model } from '@dashup/module';

/**
 * build address helper
 */
export default class CSVConnect extends Struct {
  /**
   * construct google connector
   *
   * @param args 
   */
  constructor(...args) {
    // run super
    super(...args);
    
    // save action
    this.syncAction = this.syncAction.bind(this);
    this.fieldsAction = this.fieldsAction.bind(this);
  }

  /**
   * returns connect type
   */
  get type() {
    // return connect type label
    return 'csv';
  }

  /**
   * returns connect type
   */
  get title() {
    // return connect type label
    return 'CSV';
  }

  /**
   * returns connect icon
   */
  get icon() {
    // return connect icon label
    return 'fa fa-file-csv';
  }

  /**
   * returns connect data
   */
  get data() {
    // return connect data
    return {
      
    };
  }

  /**
   * returns object of views
   */
  get views() {
    // return object of views
    return {
      config : 'connect/csv',
    };
  }

  /**
   * returns connect actions
   */
  get actions() {
    // return connect actions
    return {
      sync   : this.syncAction,
      fields : this.fieldsAction,
    };
  }

  /**
   * returns category list for connect
   */
  get categories() {
    // return array of categories
    return ['model'];
  }

  /**
   * returns connect descripton for list
   */
  get description() {
    // return description string
    return 'Google Sheets Connector';
  }

  /**
   * fields action
   *
   * @param opts 
   * @param connect 
   */
  async fieldsAction(opts, connect) {
    // data
    const data = [];
    
    // stream
    const stream = csv.parse({
      headers : true,
      maxRows : 1,
    })
      .on('error', error => console.error(error))
      .on('data', (r) => data.push(r))
      .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));

    // await
    await new Promise(async (resolve, reject) => {
      // fetch
      got.stream(connect.file[0] ? connect.file[0].url : connect.file.url)
        .on('end', resolve)
        .on('error', reject)
        .pipe(stream);
    });

    // parse csv
    return Object.keys(data[0]).map((key) => {
      // key/value
      return {
        key,
        value : data[0][key],
      };
    });
  }

  /**
   * fields action
   *
   * @param opts 
   * @param connect 
   */
  async syncAction(opts, connect, { page, model, form }) {
    // data
    const data = [];
    
    // stream
    const stream = csv.parse({
      headers : true,
    })
      .on('error', error => console.error(error))
      .on('data', (r) => data.push(r))
      .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));

    // await
    await new Promise(async (resolve, reject) => {
      // fetch
      got.stream(connect.file[0] ? connect.file[0].url : connect.file.url)
        .on('end', resolve)
        .on('error', reject)
        .pipe(stream);
    });

  // get repo
    const formPage = await new Query({
      ...opts,
    }, 'page').findById(form);

    // identifier field
    const identifierField = (formPage.get('data.fields') || []).find((c) => c.uuid === connect.identifier);

    // split into a few
    const chunks = chunk(data, 250);

    // log
    console.log(`syncing ${chunks.length} chunks`);

    // loop chunks
    for (let i = 0; i < chunks.length; i++) {
      // chunk
      const chunk = chunks[i];

      // do bulk update
      await this.dashup.connection.rpc({
        ...opts,

        page,
        form,
        model,
      }, 'model.bulk', {
        type       : 'updateOrCreate',
        query      : [],
        identifier : identifierField.name || identifierField.uuid,
      }, chunk.map((item) => {
        // update item
        const update = {};

        // set fields
        Object.keys(connect.fields).forEach((uuid) => {
          // set value
          update[uuid] = item[connect.fields[uuid]];
        });

        // return update
        return update;
      }));

      // emit to socket
      this.dashup.connection.rpc({
        ...opts,
      }, 'socket.emit', `connect.${connect.uuid}`, {
        page  : (i + 1),
        done  : chunk.length + (i * 100),
        total : data.length,
        pages : chunks.length,
      });

      // log
      console.log(`synced ${(i + 1)}/${chunks.length} chunks`);
    }

    // return true
    return true;
  }
}