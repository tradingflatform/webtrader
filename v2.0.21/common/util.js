function isTick(a){return-1!=a.indexOf("t")}function isMinute(a){return-1!=a.indexOf("m")}function isHourly(a){return-1!=a.indexOf("h")}function isDaily(a){return-1!=a.indexOf("d")}function isDotType(a){return"dot"===a}function isLineDotType(a){return"linedot"===a}function convertToTimeperiodObject(a){return{intValue:function(){return parseInt(a.toLowerCase().replace("t","").replace("h","").replace("d","").trim())},suffix:function(){return a.toLowerCase().replace(""+this.intValue(),"").trim().charAt(0)},timeInMillis:function(){var a=0;switch(this.suffix()){case"t":a=0;break;case"m":a=60*this.intValue()*1e3;break;case"h":a=60*this.intValue()*60*1e3;break;case"d":a=24*this.intValue()*60*60*1e3}return a},timeInSeconds:function(){return this.timeInMillis()/1e3},humanReadableString:function(){var a="";switch(this.suffix()){case"t":a="tick";break;case"m":a="minute(s)";break;case"h":a="hour(s)";break;case"d":a="day(s)"}return this.intValue()+" "+a}}}function isDataTypeClosePriceOnly(a){return!("candlestick"===a||"ohlc"===a)}function isSmallView(){var a=!1;return Modernizr&&(Modernizr.mq("all and (max-width: 600px)")||Modernizr.mq("all and (max-device-width: 600px)"))&&(a=!0),a}function getParameterByName(a){a=a.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var b=new RegExp("[\\?&]"+a+"=([^&#]*)"),c=b.exec(location.search);return null===c?"":decodeURIComponent(c[1].replace(/\+/g," "))}function getObjects(a,b,c){var d=[];for(var e in a)a.hasOwnProperty(e)&&("object"==typeof a[e]?d=d.concat(getObjects(a[e],b,c)):e==b&&a[b]==c&&d.push(a));return d}function validateParameters(){var a=getParameterByName("instrument"),b=getParameterByName("timePeriod");if(!a||!b)return!1;var c=null;try{c=convertToTimeperiodObject(b)}catch(d){}if(!c)return!1;var e="t"===c.suffix()&&1===c.intValue(),f=-1!=c.suffix().indexOf("m")&&-1!=[1,2,3,5,10,15,30].indexOf(c.intValue()),g=-1!=c.suffix().indexOf("h")&&-1!=[1,2,4,8].indexOf(c.intValue()),h=-1!=c.suffix().indexOf("d")&&1===c.intValue();return e||f||g||h}function load_ondemand(a,b,c,d,e){a.one(b,function(){require([d],function(a){require(["jquery","jquery-growl"],function(a){a.growl.notice({message:c})}),e&&e(a)})})}function epoch_to_string(a,b){var c=b&&b.utc?"getUTC":"get",d=new Date(1e3*a);return d[c+"FullYear"]()+"-"+("00"+(d[c+"Month"]()+1)).slice(-2)+"-"+("00"+d[c+"Date"]()).slice(-2)+" "+("00"+d[c+"Hours"]()).slice(-2)+":"+("00"+d[c+"Minutes"]()).slice(-2)+":"+("00"+d[c+"Seconds"]()).slice(-2)}function yyyy_mm_dd_to_epoch(a,b){var c=a.split("-"),d=1*c[0],e=1*c[1],f=1*c[2];return b&&b.utc?Date.UTC(d,e-1,f)/1e3:new Date(d,e-1,f).getTime()/1e3}function formatPrice(a){return(1*a).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g,"$1,")}function resizeElement(a){$(a).height($(window).height()-10).width($(window).width()-10)}function sortAlphaNum(a){"use strict";var b=/[^a-zA-Z]/g,c=/[^0-9]/g;return function(d,e){var f=d[a].replace(b,""),g=e[a].replace(b,"");if(f===g){var h=parseInt(d[a].replace(c,""),10),i=parseInt(e[a].replace(c,""),10);return h===i?0:h>i?1:-1}return f>g?1:-1}}function toFixed(a,b){return $.isNumeric(a)&&(a=Math.round(a*Math.pow(10,b))/Math.pow(10,b)),a}function uuid(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var b=16*Math.random()|0,c="x"==a?b:3&b|8;return c.toString(16)})}require(["jquery","jquery-growl"],function(a){["error","notice","warning"].forEach(function(b){var c=a.growl[b].bind(a.growl);a.growl[b]=function(b){b.message.indexOf("rate limit")>-1&&(b.message+=" Please try again after 1 minute."),b.title||(b.title=""),a('#growls .growl:contains("'+b.message+'")').remove(),c(b)}})});