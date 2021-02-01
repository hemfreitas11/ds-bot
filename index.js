const Discord = require('discord.js')
const client = new Discord.Client()
const token = 'NzQ3MTU4NjYwNzQ0MjE2Njc4.X0Kzug.r0PMdmsZI7oXLHUaQWtIWUnLI70'
const fs = require('fs')
const prefix = '!'
client.commands = new Discord.Collection()
const canalRegistro = '748731824804462702'
const idBot = '747158660744216678'

client.once('ready', () => {
	client.channels.cache.get(canalRegistro).messages.fetch(undefined, true)
	console.log('Bot Iniciado!')
})

client.login(token)

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const comando = args.shift().toLowerCase();
	
	try {
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
		}
	} catch(error) {
		console.log(error)
	}
})

const ptMsg = displayName => {
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

const engMsg = displayName => {
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
	if (!user.bot) {
		let message = reaction.message, emoji = reaction.emoji;
		const guild = message.guild
		const member = guild.member(user)
		
		const ptRole = guild.roles.cache.find(r => r.name === 'Portugues')
		const engRole = guild.roles.cache.find(r => r.name === 'English')

		member.send(emoji.name == '🇺🇸' ? engMsg(member.displayName) : ptMsg(member.displayName)).then(message => message.react('👍'))
		member.roles.add(emoji.name == '🇺🇸' ? engRole : ptRole)
	}
})

client.on('messageReactionRemove', (reaction, user) => {
	if (!user.bot) {
		const msgs = []
		// const member = reaction.message.guild.member(user)
		
		const guild = reaction.message.guild
		const ptRole = guild.roles.cache.find(r => r.name === 'Portugues')
		const engRole = guild.roles.cache.find(r => r.name === 'English')
		console.log(user.dmChannel)
		
		try {
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
			.catch(console.error);
		} catch (error) {
			console.log(error)
		}

		let message = reaction.message, emoji = reaction.emoji;

		guild.member(user).roles.remove(emoji.name == '🇺🇸' ? engRole : ptRole)
	}
})