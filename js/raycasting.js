
var cnvas;
var ctx;
var FPS = 50;

// Dimensiones del canvas en Px
var canvasAncho = 500;
var canvasAlto = 500;
var tamTile = 50;

var escenario;
var jugador;

//  Constante de los colores
const paredColor = '#000000';
const sueloColor = '#c9c9c9';
const jugadorColor = '#0000ff';

//  Objeto Tiles
var tiles;

//--------------------------------------------------------
var nivel1 = [
    [1,1,3,2,1,1,1,1,1,1],
    [1,0,0,0,0,0,3,0,0,2],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,3,0,0,0,1],
    [1,0,0,0,0,3,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,1],
    [1,0,0,1,1,1,0,0,0,3],
    [1,0,0,0,0,0,0,0,0,3],
    [3,0,0,0,0,0,0,0,0,1],
    [1,2,2,3,1,1,1,1,3,1],
];
//--------------------------------------------------------
//  Teclado
document.addEventListener('keydown',function(tecla){
    //console.log(tecla.keyCode);
    switch(tecla.keyCode){
        case 38: jugador.arriba(); break;
        case 40: jugador.abajo(); ;break;
        case 39: jugador.derecha(); ;break;
        case 37: jugador.izquierda(); ;break;
    }
});

document.addEventListener('keyup',function(tecla){
    //console.log(tecla.keyCode);
    switch(tecla.keyCode){
        case 38: jugador.avanzaSuelta(); break;
        case 40: jugador.avanzaSuelta(); ;break;
        case 39: jugador.giraSuelta(); ;break;
        case 37: jugador.giraSuelta(); ;break;
    }
});

//--------------------------------------------------------
//  reScalado
function reescalaCanvas(){
    canvas.style.width='600px';
    canvas.style.height='600px';
}

//  pintar suelo y techo
function sueloTecho(){
    ctx.fillStyle="#4c97ed";      //83dfe6";
    ctx.fillRect(0,0,500,250);
    //ctx.fillStyle="#0c8524";
    ctx.fillStyle="#bdbdbd";
    ctx.fillRect(0,250,500,500);
}

//  Normalizar angulo
function normalizaAngulo(angulo){
    angulo = angulo % (2*Math.PI);

    if(angulo < 0) angulo = angulo + (2 * Math.PI); 
    return angulo;
}

function distanciaEntrePuntos(x1,y1,x2,y2){
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

function convierteEnRadianes(angulo){
    angulo=angulo*(Math.PI/180);
    return angulo;
}

//  clase rayo
class Rayo{

    constructor(con,escenario,x,y,anguloJugador,incrementoAngulo,columna){
        this.ctx = con;
        this.escenario = escenario;
        this.x = x;
        this.y = y;
        this.incrementoAngulo = incrementoAngulo;
        this.anguloJugador = anguloJugador;
        this.angulo = anguloJugador + incrementoAngulo;
        
        this.columna = columna;
        this.distancia = 0;
        
        this.wallHitX=0;
        this.wallHitY=0;

        this.wallHitXHorizontal=0;
        this.wallHitYHorizontal=0;

        this.wallHitXVertical=0;
        this.wallHitYVertical=0;

        this.pixelTextura=0;
        this.idTextura=0;
    }

    setAngulo(angulo){
        this.anguloJugador=angulo;
        this.angulo=normalizaAngulo(angulo+this.incrementoAngulo);
    }

    cast(){
        this.xIntercept = 0;
        this.yIntercept = 0;
        this.xStep=0;
        this.yStep=0;

        //calcular la direccion de rayo N S E W
        this.abajo = false;
        this.izquierda = false;

        if(this.angulo<Math.PI) this.abajo = true;
        if(this.angulo>Math.PI/2&&this.angulo<3*Math.PI/2) this.izquierda = true;
        //==========================================
        //colisionHorizontal
        var choqueHorizontal = false;
        //buscando primera interseccion
        this.yIntercept=Math.floor(this.y / tamTile)*tamTile;
        //si apunt hacia abajo, incrementamos un tile
        if(this.abajo) this.yIntercept += tamTile;

        var adyacente = (this.yIntercept-this.y)/Math.tan(this.angulo);
        this.xIntercept = this.x+adyacente;

        //calculamos la distancia de cada paso
        this.yStep = tamTile;
        this.xStep = this.yStep / Math.tan(this.angulo);
        //si vamos hacia arriba invertimos el paso y 
        if(!this.abajo) this.yStep = -this.yStep;
        //compromamos que el paso x es coherente
        if((this.izquierda&&this.xStep>0)||(!this.izquierda&&this.xStep<0)) this.xStep = -this.xStep;

        var siguienteXHorizontal = this.xIntercept;
        var siguienteYHorizontal = this.yIntercept;

        //si apunt haci arriba, resto un pixel para forzar la colision con la casilla
        if(!this.abajo) siguienteYHorizontal--;

        //bucle para buscar punto de colision
        while(!choqueHorizontal){

            //obtenemos la casilla (redondeando por abajo)
            var casillaX = parseInt(siguienteXHorizontal/tamTile);
            var casillaY = parseInt(siguienteYHorizontal/tamTile);

            if(this.escenario.colision(casillaX,casillaY)){
                choqueHorizontal = true;
                this.wallHitXHorizontal=siguienteXHorizontal;
                this.wallHitYHorizontal=siguienteYHorizontal;
            }else{
                siguienteXHorizontal+=this.xStep;
                siguienteYHorizontal+=this.yStep;
            }
        }//fin de while

        //==========================================
        //colisionVertical
        var choqueVertical = false;
        //buscando primera interseccion
        this.xIntercept=Math.floor(this.x / tamTile)*tamTile;
        //si apunt hacia derecha, incrementamos un tile
        if(!this.izquierda) this.xIntercept += tamTile;

        var opuesto = (this.xIntercept-this.x)*Math.tan(this.angulo);
        this.yIntercept = this.y+opuesto;

        //calculamos la distancia de cada paso
        this.xStep = tamTile;
        //si va a la izquierda, invertimos
        if(this.izquierda) this.xStep=-this.xStep;
        this.yStep=tamTile*Math.tan(this.angulo);

        if((!this.abajo&&this.yStep>0)||(this.abajo&&this.yStep<0)) this.yStep = -this.yStep;

        var siguienteXVertical = this.xIntercept;
        var siguienteYVertical = this.yIntercept;

        //si apunt haci derecha, resto un pixel para forzar la colision con la casilla
        if(this.izquierda) siguienteXVertical--;
        //bucle para buscar punto de colision
        while(!choqueVertical&&(siguienteXVertical>=0&&siguienteYVertical>=0&&siguienteXVertical<canvasAncho&&siguienteYVertical<canvasAlto)){

            //obtenemos la casilla (redondeando por abajo)
            var casillaX = parseInt(siguienteXVertical/tamTile);
            var casillaY = parseInt(siguienteYVertical/tamTile);

            if(this.escenario.colision(casillaX,casillaY)){
                choqueVertical = true;
                this.wallHitXVertical=siguienteXVertical;
                this.wallHitYVertical=siguienteYVertical;
            }else{
                siguienteXVertical+=this.xStep;
                siguienteYVertical+=this.yStep;
            }
        }//fin de while

        var distanciaHorizontal = 9999;
        var distanciaVertical = 9999;

        if(choqueHorizontal){
            distanciaHorizontal=distanciaEntrePuntos(this.x,this.y,this.wallHitXHorizontal,this.wallHitYHorizontal);
        }

        if(choqueVertical){
            distanciaVertical=distanciaEntrePuntos(this.x,this.y,this.wallHitXVertical,this.wallHitYVertical);
        }

        if(distanciaHorizontal<distanciaVertical){
            this.wallHitX=this.wallHitXHorizontal;
            this.wallHitY=this.wallHitYHorizontal;
            this.distancia=distanciaHorizontal;

            var casilla = parseInt(this.wallHitX/tamTile);
            this.pixelTextura=this.wallHitX-(casilla*tamTile);

        }else{
            this.wallHitX=this.wallHitXVertical;
            this.wallHitY=this.wallHitYVertical;
            this.distancia=distanciaVertical;

            var casilla = parseInt(this.wallHitY/tamTile);
            this.pixelTextura=this.wallHitY-(casilla*tamTile);

        }

        this.idTextura=this.escenario.tile(this.wallHitX,this.wallHitY);

        //  correccion ojo de pez
        this.distancia = this.distancia*Math.cos(this.anguloJugador-this.angulo);

    }

    renderPared(){
        var altoTile=500;
        var distanciaPlanoProyeccion=(canvasAncho/2)/Math.tan(medioFOV);
        var alturaMuro=(altoTile/this.distancia)*distanciaPlanoProyeccion;

        // calculamos donde empieza y acaba la linea
        var y0 = parseInt(canvasAlto/2)- parseInt(alturaMuro/2);
        var y1 = y0 + alturaMuro;
        var x = this.columna;

        //  Dibujamos con textura
        var altoTextura=64;
        var alturaImagen=y0-y1;

        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(
            tiles,                   // img
            this.pixelTextura,       // x clipping
            (this.idTextura-1)*altoTextura,         // y clipping
            1,                       // ancho clipping
            64,                      // alto clipping
            this.columna,            // x donde empiezo  dibujar
            y1,                      // y donde empiezo  dibujar 
            1,                       //  anchura real de 1px    
            alturaImagen 
        );

        /*
        // dibujamos la columna(linea)
        this.ctx.beginPath();
        this.ctx.moveTo(x,y0);
        this.ctx.lineTo(x,y1);
        this.ctx.strokeStyle='#e01040';
        this.ctx.stroke();
        */
    }

    dibuja(){
        this.cast();
        this.renderPared();
        //mostrar rayo
        /*var xDestino = this.wallHitX;
        var yDestino = this.wallHitY;

        this.ctx.beginPath();
        this.ctx.moveTo(this.x,this.y);
        this.ctx.lineTo(xDestino,yDestino);
        this.ctx.strokeStyle='red';
        this.ctx.stroke();*/

    }

}
//  clase escenario
class Level{

    constructor(can,con,arr){
        this.canvas = can;
        this.ctx = con;
        this.matriz = arr;

        //  dimensiones de la matriz
        this.altoM = this.matriz.length;
        this.anchoM = this.matriz[0].length;

        //  dimension real del canvas
        this.altoC = this.canvas.height;
        this.anchoC = this.canvas.width;

        // dimension de los tiles
        this.altoT = parseInt(this.altoC/this.altoM);
        this.anchoT = parseInt(this.anchoC/this.anchoM);
    }

    colision(x,y){
        var choca = false;
        if(this.matriz[y][x]!=0) choca=true;
        return choca;
    }

    tile(x,y){
        var casillaX=parseInt(x/this.anchoT);
        var casillaY=parseInt(y/this.altoT);
        return(this.matriz[casillaY][casillaX]);
    }

    dibujar(){
        var color;

        for(var y=0; y<this.altoM; y++){
            for(var x=0; x<this.anchoM; x++){
                if(this.matriz[y][x]==1)
                    color = paredColor;
                else
                    color = sueloColor;
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x*this.anchoT, y*this.altoT, this.anchoT, this.altoT)
            }
        }
    }
}
//  clase jugador
const FOV=60;
const medioFOV=FOV/2;

class Player{
    constructor(con,escenario,x,y){
        this.ctx = con;
        this.escenario = escenario;
        
        this.x = x;
        this.y = y;

        this.avanza = 0;
        this.gira = 0;


        this.anguloRotacion = 0;

        this.velMovimiento = 3;
        this.velGiro = 3*(Math.PI/180);

        //  rayos
        //this.rayo = new Rayo(this.ctx,this.escenario,this.x,this.y,this.anguloRotacion,0)
        this.numRayos = canvasAncho;
        this.rayos=[];

        // angulo de cada rayo
        var incrementoAngulo=convierteEnRadianes(FOV/this.numRayos);
        var anguloInicial=convierteEnRadianes(this.anguloRotacion-medioFOV);

        var anguloRayo=anguloInicial;

        //  creando los rayos
        for(let i=0; i<this.numRayos; i++){
            this.rayos[i]=new Rayo(this.ctx,this.escenario,this.x,this.y,this.anguloRotacion,anguloRayo,i);
            anguloRayo+=incrementoAngulo;

        }
    }

    arriba(){
        this.avanza = 1;
    }

    abajo(){
        this.avanza = -1;
    }

    derecha(){
        this.gira = 1;
    }

    izquierda(){
        this.gira = -1;
    }

    avanzaSuelta(){
        this.avanza = 0;
    }

    giraSuelta(){
        this.gira = 0;
    }

    colision(x,y){
        var choca = false;

        //  en que casilla esta el jugador
        var casillaX = parseInt(x/this.escenario.anchoT);
        var casillaY = parseInt(y/this.escenario.altoT);

        if(this.escenario.colision(casillaX,casillaY)) choca=true;
        return choca;
    }

    actualiza(){
        //  Avanzamos
        var nuevaX = this.x + (this.avanza*Math.cos(this.anguloRotacion)*this.velMovimiento);
        var nuevaY = this.y + (this.avanza*Math.sin(this.anguloRotacion)*this.velMovimiento);

        if(!this.colision(nuevaX,nuevaY)){
            this.x = nuevaX;
            this.y = nuevaY;
        }
        
        //  Giramos
        this.anguloRotacion += this.gira*this.velGiro;
        this.anguloRotacion = normalizaAngulo(this.anguloRotacion);
        
        // actualizamos el angulo del rayo
        for(let i=0; i<this.numRayos; i++){
            this.rayos[i].x=this.x;
            this.rayos[i].y=this.y;
            this.rayos[i].setAngulo(this.anguloRotacion);
        }

    }

    dibujar(){
        this.actualiza();

        //actualizar angulo del rayo
        /*this.rayo.setAngulo(this.anguloRotacion);
        this.rayo.x=this.x;
        this.rayo.y=this.y;
        this.rayo.dibuja();*/
        for(let i=0; i<this.numRayos; i++){
            this.rayos[i].dibuja();
        }

        /*
        this.ctx.fillStyle = jugadorColor;
        this.ctx.fillRect(this.x-3, this.y-3, 6, 6);
        //  linea de direccion
        var xDestino = this.x+Math.cos(this.anguloRotacion)*30;
        var yDestino = this.y+Math.sin(this.anguloRotacion)*30;

        this.ctx.beginPath();
        this.ctx.moveTo(this.x,this.y);
        this.ctx.lineTo(xDestino, yDestino);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.stroke();//console.log(this.anguloRotacion);
        */
    }
}



function inicializa(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    //  Modificar el tmaño del canvas
    canvas.width = canvasAncho;
    canvas.height = canvasAlto;

    reescalaCanvas();

    escenario = new Level(canvas, ctx, nivel1);
    jugador = new Player(ctx, escenario, 200, 100);

    //  cargamos la imagen de los tiles
    tiles = new Image();
    tiles.src="img/walls.png";

    //  Iniciar Bucle Principal
    setInterval(function(){principal();}, 1000/FPS);
}


function borrarCanvas(){
    canvas.width = canvas.width;
    canvas.height = canvas.height;
}

function principal(){
    //console.log('fotograma');
    borrarCanvas()
    sueloTecho();
    //escenario.dibujar();
    //jugador.actualiza();
    jugador.dibujar();
}