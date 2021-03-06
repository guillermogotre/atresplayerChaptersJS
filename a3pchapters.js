// ==UserScript==
// @name         ATRESPLAYER Chapters
// @namespace    https://github.com/guillermogotre/
// @version      0.1
// @author       Guillermo
// @match        http://www.atresplayer.com/television/series/*/capitulo*
// @grant        none
// ==/UserScript==

(function(){
	'use strict';

	function getBaseUrl(){
		let regExp = /(http:\/\/www\.atresplayer\.com\/television\/series\/[A-Za-z\-]+\/)/g;
		let match = regExp.exec(window.location.href);
		return match[0];
	}

	function getSeasons(cb){
		let baseUrl = getBaseUrl();
		$.get(baseUrl,function(data){
			let dom = $(data);
			cb(dom.find('li a.chapter_b').length);
		});
	}

	function getSeasonsUrl(cb){
		let baseUrl = getBaseUrl();
		getSeasons(function(n){
			let seasonsUrl = [];
			for(let i=1; i<=n; i++){
				seasonsUrl.push(baseUrl + 'temporada-'+ i + '/carousel.json');
			}
			cb(seasonsUrl)
		})
	}

	function getChaptersList(cb,err){
		getSeasonsUrl(function(list){
			let ajaxs = [];
			for(let i=0; i< list.length; i++){
				ajaxs.push($.getJSON(list[i]));
			}
			$.when.apply(this,ajaxs)
				.done(
					function(){
						let result = [];
						for(let i=0; i<arguments.length; i++){
							result.push(
							{
								name: 'Temporada ' + (i+1),
								chapters: arguments[i][0][1].reverse()
							})
						}
						cb(result);
					}
				)
				.fail(err);
		})
	}


	function createSelect(season){
		let selectText = '<select style="width: 170px;padding: 0.8em;border-radius: 0.5em;border: none;color: white;font-size: 1.7em;background-color: #333;margin: 5px 5px; cursor:pointer" onChange="window.location.href=this.value">'
		selectText += '<option >'+season.name+'</option>';
		for(let chapter of season.chapters){
			selectText += `<option value="${chapter.hrefHtml}">${chapter.title}</option>`;
		}
		selectText += "</select>";
		return selectText;
	}

	function addSelect(chaptersList){
		//console.log(chaptersList);
		sessionStorage.chaptersList = JSON.stringify(chaptersList);
		let options = "";
		for(let season of chaptersList){
			options += createSelect(season);
		}
		let parent = $('section.mod_player_top');
		let width = parent.width();
		parent.append($(`<div><br><br><br><br><br>${options}</div>`));
	}

	function getNextChapterUrl(){
		if(sessionStorage.chaptersList){
			let chaptersList = JSON.parse(sessionStorage.chaptersList);
			const regex = /temporada-([0-9])\/capitulo-([0-9]+)/g;
			let match = regex.exec(window.location.href);
			let season = (+match[1]);
			let episode = (+match[2])+1;
			let episodesLength = chaptersList[season-1].chapters.length;
			if(episodesLength === episode-1){
				season += 1;
				episode = 1;
			}
			//if there's no such season it raises an error and stop the execution
			return chaptersList[season-1].chapters[episode-1].hrefHtml
		}
	}

	function checkEnd(){
		try{
			if(player.stateModel.vstate === "STATE_END" && sessionStorage.chaptersList){
				window.location.href = getNextChapterUrl();
			}
		}catch(e){}
	}

	//Chapters list
	getChaptersList(addSelect,console.log);
	//Autoplay
	$('a.play').click();
	setInterval(checkEnd,2000);

})();