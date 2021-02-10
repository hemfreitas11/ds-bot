const Discord = require('discord.js')
const Fuse = require('fuse.js')
const fs = require('fs')
const client = new Discord.Client()
const token = 'NzQ3MTU4NjYwNzQ0MjE2Njc4.X0Kzug.r0PMdmsZI7oXLHUaQWtIWUnLI70'
const prefix = '!'
client.commands = new Discord.Collection()

const canalRegistro = '748731824804462702'
const idBot = '747158660744216678'

// let mutedUsers = require('./muted-users.json')

let cmdsArray = [
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["tpa", "tpa"],
		"desc": ["Sends a teleport request to a player", "Manda um pedido de teleporte para um jogador"],
		"uso": ["/tpa <player>", "/tpa <jogador>"],
		"perm": "bkteleport.tpa"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["home", "casa"],
		"desc": ["Teleports you to your home", "Teleporta você para a sua casa"],
		"uso": ["/home <home>", "/casa <casa>"],
		"perm": "bkteleport.home"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["warp", "warp"],
		"desc": ["Teleports you to a warp", "Teleporta para uma warp"],
		"uso": ["/warp <warp>", "/warp <nome>"],
		"perm": "bkteleport.warp"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["tphere", "tpaqui"],
		"desc": ["Asks another player to teleport to you.", "Pede que outro jogador teleporte ate voce."],
		"uso": ["/tphere <player>", "/tpaqui <jogador>"],
		"perm": "bkteleport.tphere"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["tpaccept", "tpaceitar"],
		"desc": ["Accepts a teleport request", "Aceita o pedido de teleporte recebido"],
		"uso": ["/tpaccept <player>", "/tpaceitar <jogador>"],
		"perm": "N/A"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["tpdeny", "tpnegar"],
		"desc": ["Declines a teleport request", "Recusa o pedido de teleporte recebido"],
		"uso": ["/tpdeny <player>", "/tpnegar <jogador>"],
		"perm": "N/A"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["homes", "casas"],
		"desc": ["Shows a list of your homes", "Mostra uma lista das suas casas"],
		"uso": ["/homes", "/casas"],
		"perm": "N/A"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["sethome", "setcasa"],
		"desc": ["Sets a home", "Define o local da sua casa"],
		"uso": ["/sethome <home-name>", "/setcasa <casa>"],
		"perm": "bkteleport.sethome"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["delhome", "delcasa"],
		"desc": ["Deletes one of your homes", "Deleta uma de suas casas"],
		"uso": ["/delhome <home-name>", "/delcasa <casa>"],
		"perm": "bkteleport.delhome"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["warps", "warps"],
		"desc": ["Shows a list of warps", "Mostra a lista de warps"],
		"uso": ["/warps", "/warps"],
		"perm": "N/A"
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["setwarp", "setwarp"],
		"desc": ["Sets a warp", "Define uma warp"],
		"uso": ["/setwarp <warp-name>", "/setwarp <nome>"],
		"perm": "bkteleport.setwarp "
	},
	{
		"plugin": ["Bkteleport", "BkTeleporte"],
		"nome": ["delwarp", "delwarp"],
		"desc": ["Deletes a warp", "Deleta uma warp"],
		"uso": ["/delwarp <warp-name>", "/delwarp <nome>"],
		"perm": "bkteleport.delwarp "
	},
	{
		"plugin": ["BkShop", "BkLoja"],
		"nome": ["shop", "loja"],
		"desc": ["Teleports you to another player's shop", "Teleporta você para a loja de um jogador"],
		"uso": ["/shop <player>", "/loja <jogador>"],
		"perm": "bkshop.shop"
	},
	{
		"plugin": ["BkShop", "BkLoja"],
		"nome": ["shops", "lojas"],
		"desc": ["Opens a list of all the shops available", "Abre uma lista das lojas disponíveis"],
		"uso": ["/shops", "/lojas"],
		"perm": "N/A"
	},
	{
		"plugin": ["BkShop", "BkLoja"],
		"nome": ["setshop", "setloja"],
		"desc": ["Sets the location, color, or message of your shop", "Define o local da sua loja e adiciona ela na lista de lojas"],
		"uso": ["/setshop <shop | color | message>", "/setloja <loja | cor | mensagem>"],
		"perm": "bkshop.setshop"
	},
	{
		"plugin": ["BkShop", "BkLoja"],
		"nome": ["delshop", "delloja"],
		"desc": ["Deletes your shop", "Deleta sua loja"],
		"uso": ["/delshop", "/delloja"],
		"perm": "bkshop.delshop"
	}
]

/* let list = [
	{
	  "comando": "permi",
	  "author": {
		"firstName": "John",
		"lastName": "Scalzi"
	  }
	},
	{
	  "title": "The Lock Artist",
	  "author": {
		"firstName": "Steve",
		"lastName": "Hamilton"
	  }
	},
	{
	  "title": "HTML5",
	  "author": {
		"firstName": "Remy",
		"lastName": "Sharp"
	  }
	},
	{
	  "title": "Right Ho Jeeves",
	  "author": {
		"firstName": "P.D",
		"lastName": "Woodhouse"
	  }
	},
	{
	  "title": "The Code of the Wooster",
	  "author": {
		"firstName": "P.D",
		"lastName": "Woodhouse"
	  }
	},
	{
	  "title": "Thank You Jeeves",
	  "author": {
		"firstName": "P.D",
		"lastName": "Woodhouse"
	  }
	},
	{
	  "title": "The DaVinci Code",
	  "author": {
		"firstName": "Dan",
		"lastName": "Brown"
	  }
	},
	{
	  "title": "Angels & Demons",
	  "author": {
		"firstName": "Dan",
		"lastName": "Brown"
	  }
	},
	{
	  "title": "The Silmarillion",
	  "author": {
		"firstName": "J.R.R",
		"lastName": "Tolkien"
	  }
	},
	{
	  "title": "Syrup",
	  "author": {
		"firstName": "Max",
		"lastName": "Barry"
	  }
	},
	{
	  "title": "The Lost Symbol",
	  "author": {
		"firstName": "Dan",
		"lastName": "Brown"
	  }
	},
	{
	  "title": "The Book of Lies",
	  "author": {
		"firstName": "Brad",
		"lastName": "Meltzer"
	  }
	},
	{
	  "title": "Lamb",
	  "author": {
		"firstName": "Christopher",
		"lastName": "Moore"
	  }
	},
	{
	  "title": "Fool",
	  "author": {
		"firstName": "Christopher",
		"lastName": "Moore"
	  }
	},
	{
	  "title": "Incompetence",
	  "author": {
		"firstName": "Rob",
		"lastName": "Grant"
	  }
	},
	{
	  "title": "Fat",
	  "author": {
		"firstName": "Rob",
		"lastName": "Grant"
	  }
	},
	{
	  "title": "Colony",
	  "author": {
		"firstName": "Rob",
		"lastName": "Grant"
	  }
	},
	{
	  "title": "Backwards, Red Dwarf",
	  "author": {
		"firstName": "Rob",
		"lastName": "Grant"
	  }
	},
	{
	  "title": "The Grand Design",
	  "author": {
		"firstName": "Stephen",
		"lastName": "Hawking"
	  }
	},
	{
	  "title": "The Book of Samson",
	  "author": {
		"firstName": "David",
		"lastName": "Maine"
	  }
	},
	{
	  "title": "The Preservationist",
	  "author": {
		"firstName": "David",
		"lastName": "Maine"
	  }
	},
	{
	  "title": "Fallen",
	  "author": {
		"firstName": "David",
		"lastName": "Maine"
	  }
	},
	{
	  "title": "Monster 1959",
	  "author": {
		"firstName": "David",
		"lastName": "Maine"
	  }
	}
  ] */

const options = {
	// isCaseSensitive: false,
	includeScore: true,
	// shouldSort: true,
	// includeMatches: false,
	// findAllMatches: false,
	// minMatchCharLength: 1,
	// location: 0,
	// threshold: 0.6,
	// distance: 100,
	// useExtendedSearch: false,
	// ignoreLocation: false,
	// ignoreFieldNorm: false,
	keys: [
		"nome",
		"desc",
		"uso"
	]
}

const sucessoCor = "#2AFF00"
const erroCor = "#FF1B00"

const listaCmds = new Fuse(cmdsArray, options)

let status = false

client.once('ready', async () => {
	try {
		client.channels.cache.get(canalRegistro).messages.fetch(undefined, true)
		
		let prevNum = 0
		let ale = 0

		setInterval(() => {
			while (ale == prevNum) ale = Math.floor(Math.random()*14)
			prevNum = ale
			if (status){ 
				client.user.setActivity(`!help ${cmdsArray[ale].nome[0]}`, {
					type: 'PLAYING'
				})
				status = false
			} else {
				client.user.setActivity(`!ajuda ${cmdsArray[ale].nome[1]}`, {
					type: 'PLAYING'
				})
				status = true
			}
		}, 4000);
		// setInterval(() => {
		// 	if (mutedUsers.users.length > 0) {
		// 		mutedUsers.users.forEach(user => {
		// 			user.hours = user.hours - 1
		// 			if (user.hours == 0) {
		// 				delete mutedUsers.users[mutedUsers.users.indexOf(user)]
		// 				mutedUsers.users = mutedUsers.users.filter(e => e != null)
		// 			}
		// 		})
		// 		fs.writeFileSync('./muted-users.json', JSON.stringify(mutedUsers), 'utf8', () => {console.log(mutedUsers.users)})
		// 	}
		// }, 3600000)
	} catch(error) {console.log(error)}
	console.log('Bot Iniciado!')
})

client.login(token)

client.on('message', message => {
	try {
		if (message.author.bot || !isSafeMessage(message) || !message.content.startsWith(prefix)/* || isMuted(message) */) return

		// mutedUsers.users.push({info:message.member.user, hours: 3})
		// if (isMuted(message)) return

		const args = message.content.slice(prefix.length).trim().split(/ +/)
		const comando = args.shift().toLowerCase()

		if (comando == '3') {
			message.channel.send(new Discord.MessageEmbed()
				.setTitle(`Select your language | Selecione o seu idioma`)
				.setDescription('**\nTo begin, select your prefered language with the reactions bellow!\n\nPara começar, selecione o idioma que prefere nas reações abaixo!**')
				.setColor('#0443C1')
				.setURL('https://discord.gg/pVTjJT9mXZ')
				.addFields(
					{ name: '\u200B', value: '\u200B' },
					{ name: '**#English**', value: 'Click the 🇺🇸 reaction bellow this message to set your language to English.', inline:true},
					{ name: '**#Português**', value: 'Clique na reação 🇧🇷 abaixo dessa mensagem para colocar o seu idioma como Português.', inline:true},
					{ name: '\u200B', value: '\u200B' },
					)
					.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
					.setFooter('#Bkr1253 - http://bit.ly/bk-plugins'))
					.then(message => {
						message.react('🇺🇸')
						return message
					})
					.then(message => {
						message.react('🇧🇷')
						return message
					})
					.catch(error => {console.log(error)})
				} else if (comando == 'help' || comando == 'ajuda' || comando == 'permissao' || comando == 'permission' || comando == 'perm') {
					const lang = getLanguage(message.member)
					const isEnglish = lang.name === 'English'
					const comandos = listaCmds.search(args.toString())
					
					let title = isEnglish ? 'Command Help' : 'Ajuda do comando'

					if (comandos.length > 0) {
						const key = isEnglish ? 0 : 1
						const comando = comandos[0].item

						let cmdTitle = isEnglish ? `${comando.nome[key][0].toUpperCase() + comando.nome[key].slice(1)} Command` : `Comando ${comando.nome[key][0].toUpperCase() + comando.nome[key].slice(1)}`
						let desc = isEnglish ? 'Description' : 'Descrição'
						let usage = isEnglish ? 'Usage' : 'Uso'
						let perm = isEnglish ? 'Permission' : 'Permissão'
						let sugested = isEnglish ? 'Similar commands' : 'Comandos similares'
						let help = isEnglish ? 'help' : 'ajuda'

						message.reply(
							buildEmbed()
							.setURL('')
							.setTitle(title)
							.addFields(
								{name: cmdTitle, value: `***Plugin***: *${comando.plugin[key]}*\n***${desc}***: *${comando.desc[key]}*\n***${usage}***: *${comando.uso[key]}*\n***${perm}***: *${comando.perm}*\n\n`},
							)
							.setFooter(`${sugested}: \n!${help} ${comandos[1].item.nome[key] || 'null'}   !${help} ${comandos[2].item.nome[key] || 'null'}   !${help} ${comandos[3].item.nome[key]|| 'null'}   !${help} ${comandos[4].item.nome[key]|| 'null'}`)
						)

					} else {
						let n = isEnglish ? 'Command not found' : 'Comando não encontrado'
						let v = isEnglish ? `The command '${args.toString()}' was not found, try again!` : `O comando '${args.toString()}' não foi encontrado, tente novamente!`

						message.reply(
							buildEmbed(true)
								.setURL('')
								.setTitle(title)
								.addFields(
									{name: n, value: v},
								)
						)
					}

		} else if (comando == 'comandos' || comando == 'commands') {
							
		}
	} catch(error) {console.log(error)}
})

// function isMuted(message) {
// 	mutedUsers.users.forEach(e => {
// 		if (e.info.id == message.member.user.id) {
// 			message.member.user.send(
// 				buildEmbed(true)
// 					.setTitle('asdasdasdads')
// 					.setDescription('sdklqoeisdm')
// 			)
// 			message.delete()
// 			return true
// 		}
// 	})
// 	return false
// }

function isSafeMessage(message) {
	const cont = [
		'www.',
		'.com',
		'. com',
		'https://',
		'https : / /',
		'http://',
		'http : / / ',
		'http:',
		'http :',
		'https:',
		'https : ',
		'www',
		'.net',
		'. net',
		'.br',
		'. br',
		'.com.br',
		'. com . br',
		'.gg',
		'. gg',
		'discord.gg',
		'discord . gg',
		'discord.',
		'discord .',
		'discordapp.',
		'discordapp .',
		'discordapp.com',
		'discordapp . com'
	]

	/* const links = [
		{
		  "valor": "www"
		},
		{
		  "valor": "http"
		},
		{
		  "valor": "https"
		},
		{
		  "valor": "com"
		},
		{
		  "valor": "com br"
		},
		{
		  "valor": "net"
		},
		{
		  "valor": "gg"
		},
		{
		  "valor": "discord gg"
		},
		{
		  "valor": "d1sc0rd4pp  c0m"
		},
		{
		  "valor": "d1sc0rd"
		},
		{
		  "valor": "discordapp com"
		},
		{
		  "valor": "cu"
		},
		{
		  "valor": "porra"
		},
		{
		  "valor": "foder"
		},
		{
		  "valor": "caralho"
		},
		{
		  "valor": "puta"
		},
		{
		  "valor": "buceta"
		},
		{
		  "valor": "vagabundo"
		},
		{
		  "valor": "vagabunda"
		}
	]
	const options = {
		includeScore: true,
		keys: [
			"valor"
		]
	} */

	const lang = getLanguage(message.member)
	const isEnglish = lang.name === 'English'

	const titulo = isEnglish ? `You can't do that, @${message.author.username}!` : `Você não pode fazer isso, @${message.author.username}!`
	const desc = isEnglish ? 'A link was detected in your message and you will be punished if you continue to send it.' : 'Um link foi detectado na sua mensagem e você será punido se continuar a envia-lo.'
	const procurarLink = new Fuse(links, options)

	const notSafe = () => {
		message.reply(
			buildEmbed(true)
				.setURL('')
				.setTitle(titulo)
				.setDescription(desc)
		)
		// mutedUsers.users.push({info:message.member.user, hours:1})
		message.delete()
		return false
	}
	
/* 	let lastSix = ''
	let lastThree = ''
	let triggered = false */

	for (let c = 0; c < cont.length; c++) {
		if (message.content.toLowerCase().includes(cont[c])) {
			return notSafe()
		}
	}

	/* message.content.trim().replace('/', ' ').replace('.', ' ').replace('-', ' ').replace('_', ' ').replace(',', ' ').replace(';', ' ').replace(':', ' ').replace('~', ' ').replace('\'', ' ').replace('\"', ' ').split(/ +/).forEach(word => {
		word = word.toLowerCase()

		if (word.length == 1) {
			lastSix += word
			lastThree += word
		} else if (!triggered && message.content != 'gg' && word != 'is' && word != 'this' && word != 'app' && word != 'com' && word != 'br' && word != 'come' && word != 'coma' && procurarLink.search(word)[0] != null && procurarLink.search(word)[0].score < 0.34) {
			triggered = true
			return notSafe()
		}
		
		if (!triggered && lastSix == 6) {
			if (procurarLink.search(lastSix)[0] != null && procurarLink.search(lastSix)[0].score < 0.4) {
				triggered = true
				return notSafe()
			}
			lastSix = ''
		}
		
		if (!triggered && lastThree.length == 3) {
			if (procurarLink.search(lastThree)[0] != null && procurarLink.search(lastThree)[0].score < 0.4) {
				triggered = true
				return notSafe()
			}
			lastThree = ''
		}
	}) */
	return true
}

function buildEmbed(isError) {
	let cor = isError || false
	cor = isError ? erroCor : sucessoCor

	return new Discord.MessageEmbed()
		.setTitle(`Placeholder title`)
		.setColor(cor)
		.setURL('https://discord.gg/pVTjJT9mXZ')
}

function getLanguage(member) {
	const guild = member.guild
	return member.roles.cache.some(r => r.name === 'Portugues') ? guild.roles.cache.find(r => r.name === 'Portugues') : 
		guild.roles.cache.find(r => r.name === 'English')
}

function ptMsg(displayName) {
	return new Discord.MessageEmbed()
		.setTitle(`Bem-vindo(a) ao servidor, @${displayName}!`)
		.setDescription('Seja bem-vindo(a) ao BkStore, um servidor onde você pode encomendar, comprar, ou receber suporte para meus plugins!')
		.setColor('#0443C1')
		.setURL('https://discord.gg/pVTjJT9mXZ')
		.addFields(
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Suporte para Erros', value: 'Poste o seu problema no canal #Erros do plugin em que você deseja receber ajuda.'},
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Sugestões são sempre bem-vindas', value: 'Deixe suas sugestões sobre o que eu posso melhorar nos plugins no canal #Sugestões.'},
			{ name: '\u200B', value: '\u200B' },
			{ name: '#Regras', value: 'Canal onde você encontrará as regras do servidor.', inline:true},
			{ name: '#Encomendar-Plugin', value: 'Aqui você pode encomendar plugins.', inline:true},
			{ name: '#Comandos', value: 'Uma lista de todos os comandos disponiveis no servidor.', inline:true},
			{ name: '\u200B', value: '\u200B' },
		)
		.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
		.setFooter('#Bkr1253 - Meus plugins: http://bit.ly/bk-plugins')
}

function engMsg(displayName) {
	return new Discord.MessageEmbed()
		.setTitle(`Welcome to the server, @${displayName}!`)
		.setDescription('Welcome to BkStore, a server where you can order, buy, or receive support for my plugins!')
		.setColor('#0443C1')
		.setURL('https://discord.gg/pVTjJT9mXZ')
		.addFields(
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Error Support', value: 'Post you problem in the #Errors channel from the plugin you wish to receive help for.'},
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Sugestions are always welcome', value: 'Leave your sugestions about what i can improve in the #Sugestions channel.'},
			{ name: '\u200B', value: '\u200B' },
			{ name: '#Rules', value: 'Channel where you will has the server rules.', inline:true},
			{ name: '#Order-Plugin', value: 'Here you can order plugins.', inline:true},
			{ name: '#Commands', value: 'A list of all available commands in the server.', inline:true},
			{ name: '\u200B', value: '\u200B' },
		)
		.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
		.setFooter('#Bkr1253 - My plugins: http://bit.ly/bk-plugins')
}

client.on('messageReactionAdd', (reaction, user) => {
	try {
		if (!user.bot) {
			let message = reaction.message, emoji = reaction.emoji;
			const guild = message.guild
			const member = guild.member(user)
			
			const ptRole = guild.roles.cache.find(r => r.name === 'Portugues')
			const engRole = guild.roles.cache.find(r => r.name === 'English')
	
			member.send(emoji.name == '🇺🇸' ? engMsg(member.displayName) : ptMsg(member.displayName))
				.then(message => message.react('👍'))
				.catch(error => {console.log(error)})
			member.roles.add(emoji.name == '🇺🇸' ? engRole : ptRole)
		}
	} catch(error) {console.log(error)}
})

client.on('messageReactionRemove', (reaction, user) => {
	try {
		if (!user.bot) {
			const msgs = []
			// const member = reaction.message.guild.member(user)
			
			const guild = reaction.message.guild
			const ptRole = guild.roles.cache.find(r => r.name === 'Portugues')
			const engRole = guild.roles.cache.find(r => r.name === 'English')
			
			try {
				if (user.dmChannel != null) {
					user.dmChannel.messages.fetch()
						.then(messages => {
							messages.forEach(m => {
								if (m.author.id === idBot) {
									msgs.push(m)
								}
							})
							msgs[0].delete()
			
							// let toDelete = 0
			
							// console.log(member.roles.cache)
							// console.log(member.roles.cache.some(r => r.name === 'Portugues'))
			
							// if ((member.roles.cache.some(r => r.name === 'Portugues') && !member.roles.cache.some(r => r.name === 'English')) || 
							// 	(member.roles.cache.some(r => r.name === 'English') && !member.roles.cache.some(r => r.name === 'Portugues'))) toDelete = 1
							// else if (member.roles.cache.some(r => r.name === 'Portugues') && member.roles.cache.some(r => r.name === 'English')) toDelete = 2
							// while (toDelete > 0) {
							// 	msgs[0].delete()
							// 	toDelete -= 1
							// }
						})
					.catch(error => {console.log(error)});
				} 
			} catch (error) {console.log(error)}
	
			let message = reaction.message, emoji = reaction.emoji;
	
			guild.member(user).roles.remove(emoji.name == '🇺🇸' ? engRole : ptRole)
		}
	} catch(error) {console.log(error)}
})