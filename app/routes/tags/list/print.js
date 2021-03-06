import Route from '@ember/routing/route';
import ENV from 'name-tags/config/environment';
import fetch from 'fetch';
import $ from 'jquery';
import { later } from '@ember/runloop';

const showFile = (blob)=>{
  // It is necessary to create a new blob object with mime-type explicitly set
  // otherwise only Chrome works like it should
  var newBlob = new Blob([blob], {type: "application/pdf"})

  // IE doesn't allow using a blob object directly as link href
  // instead it is necessary to use msSaveOrOpenBlob
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(newBlob);
    return;
  }

  // For other browsers:
  // Create a link pointing to the ObjectURL containing the blob.
  const data = window.URL.createObjectURL(newBlob);
  const date = new Date();
  var link = document.createElement('a');
  link.href = data;
  link.download = `name-tags-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}.pdf`;
  link.click();
  setTimeout(()=>{
    // For Firefox it is necessary to delay revoking the ObjectURL
    window.URL.revokeObjectURL(data);
  }, 100)
}

export default Route.extend({
  actions: {
    closePrintList() {
      window.history.back();
    },
    didTransition(){
      if(!this.controller.get('printList.list.length')){
        this.transitionTo('tags.list.index')
      }
    },
    printTags(){
      // this.transitionTo('tags.printlist')
      this.controller.set('isWorking', true);
      later(() => {
        const tagParams = $.param({ids: this.controller.get('printList.listIds')})
        const url = new URL(`${ENV.APP.apiUrl}/${ENV.APP.apiNameSpace}printtags`),
              params = { ids: this.controller.get('printList.listIds') };
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
        fetch(url,{
          method: 'GET'
        })
        // .then(r => r.blob())
        // .then(showFile);
        // .then(response => response.blob())
        .then(response => response.json())
        .then(data => {
          if (data.hasOwnProperty('body')) {
            window.open(data.body)
          }
        })
        .then(this.controller.set('isWorking', false))
      }, 250);
    }
  }
});
