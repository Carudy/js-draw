const server_addr = '10.147.19.5'
// const server_addr = '10.147.17.162'
const server_port = '6789'
var   server_url = 'http://' + server_addr + ':' + server_port
var   ter = 100
var cd = {
        'beat' : 0,
        'chat' : 0,
        'ask_line' : 0,
        'info' : 0,
    }
var beat_fail = 0
var player_id = 0, player_type = 0
var chat_id = 0

var c = document.getElementById("canva")
var cxt = c.getContext("2d")
cxt.fillStyle = "#efefde"

var lines = [], drawing = false, draw_cnt = 0, up_line = 0, draw_id = 0

$(() => { 
    $('#nick').val('You')
    $('#addr').val(server_addr)
    $('#port').val(server_port)
    $('#type').val(0)

    $('#canva').mousedown(e=>{
        if(player_type!=1)return
        if(!drawing){
            drawing = true
            draw_cnt += 1
            lines.push([e.offsetX, e.offsetY, draw_cnt])
            cxt.moveTo(e.offsetX, e.offsetY)
        }
    })

    $('#canva').mousemove(e=>{
        if(player_type!=1)return
        if(drawing){
            lines.push([e.offsetX, e.offsetY, draw_cnt])
            cxt.lineTo(e.offsetX, e.offsetY)
            cxt.stroke()
        }
    })

    $('#canva').mouseup(e=>{
        // console.log(up_line, lines.length)
        if(player_type!=1 || up_line>=lines.length) return
        drawing = false
        send({
                'cmd' : 'up_line',
                'uid' : player_id,
                'lines' : lines.slice(up_line),
            }, res=>{})
        up_line = lines.length
    })

    $('#link').click(()=>{
        player_type = $('#type').val()
        server_url = 'http://' + $('#addr').val() + ':' + $('#port').val()
        send({
                'cmd' : 'reg',
                'name' : $('#nick').val(),
            }, res=>{
                $('#info0').text('成功连接')
                player_id = res.uid
                beat_fail = 0
            })
    })

    $('#speak').click(()=>{
        if($('#speech').val().length==0){
            $('#info1').text('消息不能为空！')
            return
        }

        send({
            'cmd' : 'say',
            'uid' : player_id,
            'cont' : $('#speech').val(),
        }, res=>{})
        $('#speech').val('')
    })


    $('#ready').click(()=>{
        send({
            'cmd' : 'ready',
            'uid' : player_id,
        }, res=>{})
    })

    $('#redraw').click(()=>{
        if (player_type!=1) return
        send({
            'cmd' : 'redraw',
            'uid' : player_id,
        }, res=>{})
    })

    // hot keys
    $(window).on('keypress', function(e) {
        if (e.keyCode ===13) $('#speak').trigger('click')
    })

    setInterval(god, ter)
})


//************************************************************* 
send = (data, callback)=>{
    $.post(server_url, JSON.stringify(data), (res)=>{
        callback(res)
    })
}

heart_beat = ()=>{
    if (player_id==0) return
    if (cd['beat'] >= 2000) {
        beat_fail += 1
        cd['beat'] = 0
        send({'cmd' : 'beat', 'uid' : player_id}, res=>{
            if(res.res=='ok'){
                $('#info0').text('成功连接')
                beat_fail = 0
            }else{
                $('#info0').text('连接失败')
                player_id = 0
                player_type = 0
            }
        })
    }
    if(beat_fail>1){
        $('#info0').text('连接失败')
    }
}

ask_chat = ()=>{
    if (cd['chat'] < 500) return
    cd['chat'] = 0
    send({'cmd' : 'ask_chat', 'from' : chat_id}, res=>{
        if(res.n>0){
            for (i in res.data) {
                let cont = res.data[i][0] + ': ' + res.data[i][1]  
                cont = '<div class="chat_box">' + cont + '</div>'              
                $('#chat_board').html($('#chat_board').html() + cont)
            }
            chat_id += res.n
            $('#chat_board').scrollTop(999999)
        }
    })
}

ask_line = () => {
    if (cd['ask_line'] < 500) return
    cd['ask_line'] = 0
    send({'cmd' : 'ask_line', 'from' : lines.length}, res=>{
        if(res.lines.length==0)return
        cxt.moveTo(res.lines[0][0], res.lines[0][1])
        for (let i=1; i<res.lines.length; ++i) {
            if(res.lines[i][2]!=res.lines[i-1][2]){
                cxt.moveTo(res.lines[i][0], res.lines[i][1])
            }else{
                cxt.lineTo(res.lines[i][0], res.lines[i][1])
            }
        }
        lines = lines.concat(res.lines)
        cxt.stroke()
    })
}

ask_info = () =>{
    if (cd['info'] < 1000) return
    cd['info'] = 0
    send({'cmd' : 'info', 'uid' : player_id}, res=>{
        if (draw_id!=res.draw_id){
            console.log('R')
            lines = []
            up_line = 0
            draw_cnt = 0
            draw_id = res.draw_id
            // cxt.clearRect(0, 0, 10000, 10000)
            c.width = c.width
        }

        $('#online-user').text(res.users.join(', '))
    })
}

god = ()=>{
    for(i in cd){ cd[i] += ter }

    // whether alive
    heart_beat()
    if(beat_fail>1){return}
    if(player_id==0){return}
    
    // work
    ask_chat()
    ask_info()
    if (player_type==0) ask_line()

}


