var html_ejemplo = `
<!DOCTYPE html>
<html lang="en">
<head>
<title>Cargando...</title>
<meta name="referrer" content="no-referrer">
<meta charset="utf-8">
</head>
<body>
Texto
</body>
</html>
`

try{window}catch(e){window = {}}
window.a = {}

a.seccionar = function(texto,regex){
	return [...texto.match(regex)].slice(1)
}
a.analizar_atributos = function(texto_etiqueta){
	var atributos = texto_etiqueta.match(/.*?=["'].*?["']/g)
	if(atributos==null){
		console.warn(
			"Advertencia: Es imposible analizar: ",texto_etiqueta
		)
	}
	return atributos && (atributos
		.map(x=>x.trim())
		.map(x=>x.match(/(.*)=["'](.*)["']/).slice(1))
	) || texto_etiqueta
}
a.analizar_parte = function(tipo,x){
	var devuelve = x
	if(tipo=="doctype"){
		devuelve = x.match(/(<!doctype )(.*)(>)/i).slice(2,-1)[0]
	}
	if(tipo=="etiqueta"){
		var etiqueta = {
			tipo: /<[^/].*>/.test(x)?"abre":"cierra",
			partes: x.match(/^<\/?(.*?)(\s+(.*))?>$/)
		}
		if(etiqueta.partes){
			etiqueta.partes = [etiqueta.partes[1],etiqueta.partes[3]]
		}
		var neutrales = "area base br col hr img input link meta param"
			.split(" ").join("|")
		var regex_neutrales = new RegExp(`^${neutrales}$`,"i")
		if(regex_neutrales.test(etiqueta.partes[0])){
			etiqueta.tipo = "neutral"
		}
		devuelve = etiqueta
	}
	return devuelve
}

a.analizar_etiqueta = function(x){
	var tipo = /<!doctype.*>/i.test(x)?"doctype"
		:/<.*>/.test(x)?"etiqueta"
		:null
	var datos = a.analizar_parte(tipo,x)
	var dentro = null
	var objeto = {tipo: tipo && tipo || "dentro"}
	dentro && (objeto.dentro = dentro)
	datos && (
		tipo!="etiqueta" && (objeto.datos = datos),
		datos.partes && (
			datos.partes[0] && (objeto.nombre = datos.partes[0]),
			datos.partes[1] && (objeto.atributos = a.analizar_atributos(
				datos.partes[1]
			))
		),
		datos.tipo && (objeto.apertura = datos.tipo)
	)
	return objeto
}
a.analizar_html = function(texto_html){
	var partes = (texto_html
		.match(/(<.*?>)|(.+?)/g)
	)
	var nuevas_partes = []
	var texto = ""
	var es_char = null
	for(var i in partes){
		var x = partes[i]
		es_char = x.length==1
		if(es_char){
			texto += x
		}else{
			texto!=="" && nuevas_partes.push(texto)
			nuevas_partes.push(x)
			texto = ""
		}
	}
	var tabs = 0
	var array = []
	var niveles = [array]
	for(var i in nuevas_partes){
		var x = nuevas_partes[i]
		var etiqueta = a.analizar_etiqueta(x)
		var apertura_actual = etiqueta.apertura
		if(apertura_actual!="cierra"){
			delete(etiqueta.apertura)
			niveles[tabs].push(etiqueta)
		}
		if(apertura_actual=="abre"){
			++tabs
			var nivel = []
			niveles[tabs] = nivel
			niveles[tabs-1].slice(-1)[0].nodos = nivel
		}
		if(apertura_actual=="cierra"){
			--tabs
		}
	}
	return array
}

a.unir_atributos = function(array_atributos){
	var x = array_atributos
	return x.map(x=>x).map(x=>`${x[0]}=${JSON.stringify(x[1])}`).join(" ")
}
a.mostrar_html_analizado = function(html_analizado,tabs){
	// La función es recursiva
	var salida = ""
	var tabs = tabs==null?0:tabs
	for(var i in html_analizado){
		var x = html_analizado[i]
		var espacios = [...Array(tabs)].fill("  ").join("")
		salida += espacios
		if(x.tipo=="doctype"){
			salida += `<!${x.tipo.toUpperCase()
			} ${x.datos}>\n`
		}
		if(x.tipo=="etiqueta"){
			salida += `<${x.nombre
			}${x.atributos &&
				` ${a.unir_atributos(x.atributos)}`
				|| ""
			}>\n`
			if(x.nodos){
				salida += a.mostrar_html_analizado(x.nodos,tabs+1)
				salida += `${espacios}</${x.nombre}>\n`
			}
		}
		if(x.tipo=="dentro"){
			salida += `${x.datos}\n`
		}
	}
	return salida
}

analizado = a.analizar_html(html_ejemplo)
a.mostrar_html_analizado(analizado)
