var Footer = {

    init: function(){
        
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$leftBtn = this.$footer.find('.icon-left')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.isToStart = true
        this.isToEnd = false
        this.isAnimate = false

        this.getData()
        this.bind()
        
    },

    bind: function(){
        var _this = this
        var itemWidth = _this.$box.find('li').outerWidth(true)
        var rawCount = Math.floor(_this.$box.width() / itemWidth)

        this.$rightBtn.click(function(){
            if (_this.animate) return
            if (!_this.isToEnd){
                _this.isToStart = false
                _this.animate = true
                _this.$ul.animate({
                    left: '-=' + rawCount * itemWidth
                },400,function(){
                    _this.animate = false
                    if (_this.$box.width() - parseFloat(_this.$ul.css('left')) >= _this.$ul.width()){
                        _this.isToEnd = true
                    }
                })
            }
            
        })

        this.$leftBtn.click(function(){
            if (_this.animate) return
            if (!_this.isToStart){
                _this.isToEnd = false
                _this.animate = true
                _this.$ul.animate({
                    left: '+=' + rawCount * itemWidth
                },400,function(){
                    _this.animate = false
                    if (parseFloat(_this.$ul.css('left')) >= 0){
                        _this.isToStart = true
                    }
                })
            }
            
        })

        this.$ul.on('click','li',function(){
            $(this).addClass('active').siblings().removeClass('active')
            eventCenter.fire('select_album', {
                channelid: $(this).find('div').attr('channelId'),
                channelname: $(this).find('h3').text()})
        })
    },

    getData: function(){
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getChannels.php')
            .done(function(ret){
                _this.render(ret.channels)
            })
            .fail(function(){
                console.log('error')
            })
    },

    render: function(channels){
        var html = ''

        channels.forEach(function(channel){
            html += 
                "<li>" +
                    "<div class='cover' channelId='" + channel.channel_id + "' style='background-image:url(" + channel.cover_middle + ")'></div>" +
                    "<h3>" + channel.name + "</h3>" +
                "</li>"
        })
        this.$ul.html(html)
        this.setStyle()
    },

    setStyle: function(){
        count = $('footer').find('.box li').length
        width = $('footer').find('.box li').outerWidth(true)
        this.$ul.css({
            'width': count * width + 'px'
        })
    }
}

var Fm = {
    init: function(){
        this.channel_id = 'public_tuijian_spring'
        this.channel_name = '漫步春天'
        this.audio = new Audio
        this.audio.autoplay = true
        this.clock = null
        this.$container = $('#page-music main')

        this.bind()

        eventCenter.fire('select_album', {
            channel_id: this.channel_id,
            channel_name: this.channel_name
        })
    },

    
    bind: function(){
        var _this = this

        eventCenter.on('select_album', function(e, data){
            _this.channel_id = data.channelid
            _this.channel_name = data.channelname
            _this.loadSong()
        })

        _this.$container.find('.btn-play').click(function(){
            if($(this).hasClass('icon-play-btn')){
                $(this).removeClass('icon-play-btn').addClass('icon-zanting')
                _this.audio.play()
            } else {
                $(this).removeClass('icon-zanting').addClass('icon-play-btn')
                _this.audio.pause()
            }
        })

        _this.$container.find('.btn-next').click(function(){
            _this.loadSong()
        })

        _this.audio.addEventListener('play',function(){
            clearInterval(_this.clock)
            _this.clock = setInterval(function(){
                _this.updateStatement()
                _this.setLyric()
            },1000)
        })

        _this.audio.addEventListener('pause',function(){
            clearInterval(_this.clock)
        })
    },

    loadSong: function(){
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php', {
            channel: _this.channel_id
        }).done(function(ret){
            _this.play(ret.song[0])
        })
    },

    loadLyric: function(song_sid){
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php', {
            sid: song_sid
        }).done(function(ret){
            lyricObj = {}
            ret.lyric.split('\n').forEach(function(line){
                time = line.match(/\d{2}:\d{2}/)
                str = line.replace(/\[.+?\]/,'')
                lyricObj[time] = str
            })
            _this.lyricObj = lyricObj
        })
    },

    setLyric: function(){
        timeStr = '0' + Math.floor(this.audio.currentTime / 60) + ":" + (this.audio.currentTime % 60 / 100).toFixed(2).substr(2)
        if (this.lyricObj[timeStr]) {
            this.$container.find('.lyric p').text(this.lyricObj[timeStr]).boomText()
        }   
    },

    play: function(song){
        this.$container.find('.music-title').text(song.title)
        this.$container.find('.author').text(song.artist)
        this.$container.find('figure').css('background-image','url('+ song.picture + ')')
        this.$container.find('.tag').text(this.channel_name)
        $('.bg').css('background-image','url('+ song.picture + ')')
        this.audio.src = song.url
        this.$container.find('.btn-play').removeClass('icon-play-btn').addClass('icon-zanting')

        this.loadLyric(song.sid)
    },

    updateStatement: function(){
        var time = Math.floor(this.audio.currentTime / 60) + ":" + (this.audio.currentTime % 60 / 100).toFixed(2).substr(2)
        this.$container.find('.current-time').text(time)
        this.$container.find('.bar-progress').css('width', (this.audio.currentTime / this.audio.duration) * 100 + '%')
    }
}

var eventCenter = {
    on: function(type, handler){
        $(document).on(type, handler)
    },

    fire: function(type, data){
        $(document).trigger(type, data)
    }
}

$.fn.boomText = function(type){
    type = type || 'rollIn'
    
    this.html(function(){
        var arr = $(this).text()
            .split('').map(function(word){
                return '<span class="boomText">' + word + '</span>'
            })
        return arr.join('')
    })

    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function(){
        $boomTexts.eq(index).addClass('animated '+ type)
        index ++
        if (index >= $boomTexts.length){
            clearInterval(clock)
        }
    },300)
}

Footer.init()
Fm.init()