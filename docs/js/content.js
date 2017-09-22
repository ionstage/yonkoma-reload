(function(app) {
  var content = {};

  content.images = [
    { name: '0000000' },
    { name: '0000001' },
    { name: '0000002', last: true },
    { name: '0000003' },
    { name: '0000004' },
    { name: '0000005', last: true },
  ];

  app.content = content;
})(this.app || (this.app = {}));
