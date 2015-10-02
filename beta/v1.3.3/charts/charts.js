define(["jquery","websockets/eventSourceHandler","common/util","highstock","highcharts-exporting"],function(a,b){"use strict";return a(function(){Highcharts.setOptions({global:{useUTC:!0}})}),{drawChart:function(c,d,e,f,g,h){a(c).highcharts()&&(this.destroy(c,f,d),a(c).highcharts().destroy()),a(c).data({instrumentCode:d,instrumentName:e,timeperiod:f,type:g}),a(c).highcharts("StockChart",{chart:{events:{load:function(){this.showLoading(),,d=[],e=void 0;a(c.series).each(function(b,c){a(c).data("isInstrument")&&(d.push(c.name),e=c.options.compare)}),this.drawChart(b,a(b).data("instrumentCode"),a(b).data("instrumentName"),a(b).data("timeperiod"),a(b).data("type"),e);var f=this;require(["instruments/instruments"],function(c){a(d).each(function(d,e){var g=c.getSpecificMarketData(e);void 0!=g.symbol&&a.trim(g.symbol)!=a(b).data("instrumentCode")&&f.overlay(b,g.symbol,e)})})},addIndicator:function(b,c){if(a(b).highcharts()){var d=a(b).highcharts(),e=d.series[0];e&&d.addIndicator(a.extend({id:e.options.id},c))}},overlay:function(c,d,e){if(a(c).highcharts()){var f=a(c).highcharts(),g=a(c).data("timeperiod"),h=a(c).data("type");f.showLoading();for(var i=0;i<f.series.length;i++){var j=f.series[i];if(a(j).data("isInstrument")){var k=j.options.data;j.setData([]);for(var l=0;l<k.length;l++)k[l].x&&k[l].y&&(k[l]=[k[l].x,k[l].y]);j.update({compare:"percent"}),j.setData(k),a(j).data("isInstrument",!0)}else a(j).data("onChartIndicator")&&j.update({compare:"percent"})}b.retrieveChartDataAndRender(c,d,e,g,h,"percent")}}}});