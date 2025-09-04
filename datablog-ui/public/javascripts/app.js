/* global angular */
angular.module('Datablog', []);

angular.module('Datablog').controller('MainController', ctrlFunc);

function ctrlFunc() {
  /* TODO Actually Fetch Data from API
       https://angular.io/guide/http
       for now simulate the data being returned
    */

  // Simulate Data
  this.pages = [];
  for (let i = 1; i <= 10; i++) {
    this.pages.push({
      id: i,
      title: `Angular Page ${i}`,
      body: 'This is the body',
      created: '2018-04-14',
    });
  }
}
