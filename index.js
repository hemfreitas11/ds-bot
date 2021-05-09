const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const paypal = require('paypal-rest-sdk')
const Schema = mongoose.Schema
const Discord = require('discord.js')
const MessageEmbed = Discord.MessageEmbed
const client = new Discord.Client()
const {Client: SlashClient} = require("discord-slash-commands-client")
const Fuse = require('fuse.js')

configureExpress()

const { token, prefix, CANAL_REGISTRO, CANAL_WELCOME, UsuarioComprando, SITE_RETORNO, uri, UserRegistrado, pluginsCompraveis, cmdsArray, listaCmds, PluginsComprados, ERRO_COR, SUCESSO_COR, ID_SERVIDOR } = getConstants()
const { comprarCommand, buyCommand, autorizarCommand, authorizeCommand, desautorizarCommand, deauthorizeCommand, bug, helpCommand, ajudaCommand } = getCommands()

client.interactions = new SlashClient(token, '747158660744216678')

client.on("ready", () => {
	try {
		cacheRegisterChannel()
		startStatusAnimation()
		startBackend()
		// startMutedManager()
		// createCommands()
	} catch (error) { console.log(error) }
	/* client.interactions
		.createCommand({
			name: "unique",
			description: "Test."
		}, ID_SERVIDOR)
		.then(command => {
			client.interactions.editCommandPermissions(
				[
					{
						id: '742470738346508288',
						type: 1,
						permission: true,
					}
				], ID_SERVIDOR, command.id
			)
		})
		.catch(error => console.log(error)) */
	console.log('Bot Iniciado!')
})

client.ws.on('INTERACTION_CREATE', async (interaction) => {
	if (interaction.type == 1) return
	try {
		interaction.reply = reply
		interaction.delete = async (messageId = '@original') => {
		  await client.api.webhooks(client.user.id, interaction.token).messages(messageId).delete();
		}
		interaction.guild = client.guilds.cache.get(interaction.guild_id)
		interaction.author = interaction.guild.members.cache.get(interaction.member.user.id)
		interaction.channel = interaction.guild.channels.resolve(interaction.channel_id)
		let channel = interaction.channel
		channel.startTyping()
		const comando = interaction.data.name
		// if (message.author.bot) return
		// mutedUsers.users.push({info:message.member.user, hours: 3})
		// if (isMuted(message)) return
		// const args = message.content.slice(prefix.length).trim().split(/ +/)
		if(await isValidCommandChannel(interaction)) {
			if (comando == 'comprar' || comando == 'buy') {
				await comandoComprar(interaction)
				channel.stopTyping()
			} else if (comando == 'autorizar' || comando == 'authorize') {
				if (await hasValidOptions(interaction, 2)) {
					await comandoAutorizar(interaction)
					channel.stopTyping()
				}
			} else if (comando == 'desautorizar' || comando == 'deauthorize') {
				if (await hasValidOptions(interaction, 1)) {
					await comandoDesautorizar(interaction)
					channel.stopTyping()
				}
			} else if (comando == 'bug') {
				await comandoBug(interaction)
				channel.stopTyping()
			} else if (comando == 'help' || comando == 'ajuda') {
				if (await hasValidOptions(interaction, 1)) {
					await comandoAjuda(interaction)
					channel.stopTyping()
				}
			} else if (comando == 'unique') {
				await howToBuyMessage()
				channel.stopTyping()
			}
		} else {
			channel.stopTyping()
		}
	} catch (error) { console.log(error) }
})

client.login(token)

client.on("messageReactionAdd", (reaction, user) => {
	try {
		if (!user.bot) {
			let message = reaction.message
			let emoji = reaction.emoji
			const guild = message.guild
			const member = guild.members.resolve(user.id)
			if (message.channel.id == CANAL_REGISTRO) {
				const ptRole = guild.roles.cache.find(r => r.name === 'Portugues')
				const engRole = guild.roles.cache.find(r => r.name === 'English')

				const welcomeChannel = client.guilds.cache.get(ID_SERVIDOR).channels.cache.get(CANAL_WELCOME)
				if (!isWelcomed(welcomeChannel, user.id)) {
					welcomeChannel.send(emoji.name == '🇺🇸' ? engMsg(member.user) : ptMsg(member.user))
						.then(message => message.react('👍'))
						.catch(error => { console.log(error) })
				}
				member.roles.add(emoji.name == '🇺🇸' ? engRole : ptRole)
				.catch(err => {
					console.log(err)
					message.reply(err | 'Error')
				})
			} else {
				isPrivateUserChannel(user, message.channel.id, message.channel.name.split('-')[1]).then(isPrivateChannel => {
					if (isPrivateChannel) {
						const isEnglish = isEnglishMember(member)
						const pluginCompravel = getPluginCompravel(message.channel.name.split('-')[1])
						
						if (pluginCompravel == null) {
							message.reply(buildEmbed(true, user).setTitle(isEnglish ? 'Unexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription('Error #3\n\u200B'))
							return
						}
						
						PluginsComprados.find()
							.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.discord_id == user.id))
							.then(registros => registros.filter(registro => registro.plugin.toLowerCase() == isEnglish ? pluginCompravel.nome[0].toLowerCase() : pluginCompravel.nome[1].toLowerCase()))
							.then(registroArray => {
								if (registroArray[0] === undefined || registroArray.length == 0) {
									if	(emoji.name == '🇺🇸' || emoji.name == '🇧🇷' || emoji.name == '🇪🇺') {
										UsuarioComprando.find()
											.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.discord_id == user.id))
											.then(registros => registros.filter(registro => registro.plugin == isEnglish ? pluginCompravel.nome[0].toLowerCase() : pluginCompravel.nome[1].toLowerCase()))
											.then(registroArray => {
												if (registroArray[0] != undefined && registroArray.length > 0) {
													let userComprando = registroArray[0]
													
													if (userComprando == null || userComprando == undefined) {
														message.reply(buildEmbed(true, user).setTitle(isEnglish ? 'Unexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription('Error #4\n\u200B'))
														return
													}
													let { moeda, simbolo, valor } = getPaymentInfo(emoji, pluginCompravel, userComprando)
													
													const confirmTitle = ['Confirm', 'Confirmar']
													const confirmDescription = [`\nYou selected the currency: **${moeda}**\nPayment amount: **${simbolo}${valor}**\n\n**If you selected the correct currency, click the ✅ bellow to continue.**\n\nYou can select the currency again in the first message if you selected the wrong one.`, `\nVocê selecionou a moeda: **${moeda}**\nValor do pagamento: **${simbolo}${valor}**\n\n**Se a moeda estiver correta clique no ✅ abaixo para continuar.**\n\nVocê pode selecionar a moeda novamente na primeira mensagem caso tenha selecionado errado.`]

													userComprando.save()
														.then(result => {
															if (moeda != null) {
																message.channel.send(new MessageEmbed()
																	.setTitle(isEnglish ? confirmTitle[0] : confirmTitle[1])
																	.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
																	.setDescription(isEnglish ? confirmDescription[0] : confirmDescription[1])
																	.setColor('#0443C1')
																	.setURL('')
																)
																	.then(message => {
																		message.react('✅')
																		return message
																	})
																	.catch(error => { console.log(error) })
															} else {
																message.reply(buildEmbed(true, user).setTitle(isEnglish ? 'Unexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription(err))
															}
														})
												}
											})
											.catch(err => {
												console.log(err)
												message.reply(err | 'Error')
											})
									} else if (emoji.name == '✅') {
										const generatingTitle = ['Generating', 'Gerando']
										const generatingDescription = ['Generating payment link, this might take a few seconds...', 'Gerando link de pagamento, isso pode demorar alguns segundos...']

										message.reply(buildEmbed(false, user).setTitle(isEnglish ? generatingTitle[0] : generatingTitle[1]).setURL('').setColor('#0443C1').setDescription(isEnglish ? generatingDescription[0] : generatingDescription[1])
										.setFooter('')
										.setTimestamp(null))					
										UsuarioComprando.find()
											.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.discord_id == user.id))
											.then(registros => registros.filter(registro => registro.plugin == isEnglish ? pluginCompravel.nome[0].toLowerCase() : pluginCompravel.nome[1].toLowerCase()))
											.then(registroArray => {
												if (registroArray[0] != undefined && registroArray.length > 0) {
													let userComprando = registroArray[0]
													
													if (userComprando == null || userComprando == undefined) {
														message.reply(buildEmbed(true, user).setTitle(isEnglish ? 'Unexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription('Error #4\n\u200B'))
														return
													}
					
													const plugin_name = 'Plugin ' + userComprando.get('plugin')
													let currency = userComprando.get('currency')
					
													let currencyIndex = getCurrencyIndex(currency)
													
													if (currencyIndex == null) {
														message.reply(buildEmbed(true, user).setTitle(isEnglish ? 'Unexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription('Error #9\n\u200B'))
														return
													}
					
													const price = pluginCompravel.valor[currencyIndex]
													const discord_id = user.id || 'null'
													const successUrl = SITE_RETORNO + `/success-${pluginCompravel.nome[0].toLowerCase()}-${currency.toLowerCase()}`
													const cancelUrl = SITE_RETORNO + '/cancel'
													const create_payment_json = createPaymentJson(successUrl, cancelUrl, plugin_name, price, currency, discord_id)
													
													if (discord_id == null || discord_id == undefined) {
														message.reply(buildEmbed(true, user).setTitle(isEnglish ? 'Unexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription('Error #46\n\u200B'))
														return
													}
					
													paypal.payment.create(create_payment_json, function (error, payment) {
														if (error) {
															message.reply(buildEmbed(true, user).setTitle(isEnglish ? 'Unexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription(error))
															console.log(error)
														} else {
															for(let i = 0;i < payment.links.length; i++){
																if(payment.links[i].rel === 'approval_url'){
																	const paymentTitle = ['Payment link created', 'Link de pagamento criado']
																	const paymentDescription = [`The payment is 100% secure and made entirely inside of PayPal. \n\nYour payment info is **NEVER** sent to me.\n\nClick the link bellow to open the browser and make the payment with PayPal: \n${payment.links[i].href}`, `O pagamento é 100% seguro e realizado inteiramente dentro do Paypal. \n\nSuas informações de pagamento **NUNCA** serão enviados para mim.\n\nClique no link abaixo para abrir o navegador e efetuar o pagamento através do PayPal:\n${payment.links[i].href}`]
																	message.reply(buildEmbed(false, user).setTitle(isEnglish ? paymentTitle[0] : paymentTitle[1]).setURL('').setDescription(`${isEnglish ? paymentDescription[0] : paymentDescription[1]}\n\u200B`)
																	.setFooter('')
																	.setTimestamp(null))
																}
															}
														}
													})
												}
											})
											.catch(err => {
												console.log(err)
												message.reply(err | 'Error')
											})
									}
								} else {
									message.reply(buildEmbed(true, user).setTitle(isEnglish ? '**Error**' : '**Erro**').setURL('').setDescription(isEnglish ? 'Thanks, but you already bought this plugin!\n\u200B' : 'Obrigado, mas você já comprou este plugin!\n\u200B'))
								}
							})
							.catch(err => {
								console.log(err)
								message.reply(err | 'Error')
							})
					}
				})
				.catch(err => {
					console.log(err)
					message.reply(err | 'Error')
				})
			}
		}
	} catch (error) { console.log(error) }
})

client.on('messageReactionRemove', (reaction, user) => {
	try {
		if (!user.bot) {
			if	(reaction.message.channel.id == CANAL_REGISTRO){
				// const member = reaction.message.guild.member(user)
	
				const guild = reaction.message.guild
				const ptRole = guild.roles.cache.find(r => r.name === 'Portugues')
				const engRole = guild.roles.cache.find(r => r.name === 'English')
				
				/* try {
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
							.catch(error => { console.log(error) })
					}
				} catch (error) { console.log(error) }
	
				let message = reaction.message, emoji = reaction.emoji */
	
				guild.member(user).roles.remove(reaction.emoji.name == '🇺🇸' ? engRole : ptRole)
			}
		}
	} catch (error) { console.log(error) }
})

async function isValidCommandChannel(interaction) {
	const validChannels = ['805668772870357002','747498746526564512', '838975029504901150', '839156596947943424', '805668906480042026','747496262441369640','838802030490288199','839157047214735430','805670496397557831','747496874793107538','805670707551141889','778021974873079828','839218734056734730','741072931592994909']
	let returnValue = false

	if (validChannels.includes(interaction.channel_id)) {
		returnValue = true
	} else {
		const isEnglish = isEnglishMember(await fetchMember(interaction.guild_id, interaction.member.user.id))
		interaction.reply(buildEmbed(true, interaction.author.user).setURL('').setTitle(isEnglish ? 'Invalid Channel' : 'Canal Inválido').setDescription(isEnglish ? `You can use commands in the channels: \n\n<#805668906480042026>, <#805668772870357002>, <#805668197457592341>, <#838975029504901150>\n and the "Bugs" channel of any plugin\n\u200B` : `Você pode usar comandos nos canais: \n\n<#747496262441369640>, <#747498746526564512>, <#778332211090423838>, <#839156596947943424>\n e no canal "Bugs" de qualquer plugin\n\u200B`))
	}
	return returnValue
}

function isWelcomed(channel, user_id) {
	let returnValue = false
	channel.messages.cache.each(message => {
		if (returnValue) return
		if (message.embeds[0].description.includes(user_id)) {
			returnValue = true
		}
	})
	return returnValue
}

async function fetchMember(guild_id, id) {
	const response = await fetch(`https://discord.com/api/v8//guilds/${guild_id}/members/${id}`, {
		headers: {
			Authorization: `Bot ${token}`
		}
	})
	if (!response.ok) console.log(new Error(`Error status code: ${response.status}`))
	return await response.json()
}

async function reply(response) {
	let interaction = this
	let data = {
		content: response
	}

	if (typeof response === 'object') response.embeds ? data = await createAPIMessage(interaction, response.embeds[0]) : data = await createAPIMessage(interaction, response)

	client.api.interactions(interaction.id, interaction.token).callback.post({
		data: {
			type: 4,
			data
		}
	})
} 

function createCommands() {
	client.interactions
		.createCommand(comprarCommand, ID_SERVIDOR)
		.then(setToPtRole())
		.then(result => { console.log('Created comprar command') })
		.then(command => {
			setTimeout(() => {
				client.interactions
					.createCommand(buyCommand, ID_SERVIDOR)
					.then(setToEnRole())
					.then(result => { console.log('Created buy command') })
					.then(command => {
						setTimeout(() => {
							client.interactions
								.createCommand(autorizarCommand, ID_SERVIDOR)
								.then(setToPtRole())
								.then(result => { console.log('Created autorizar command') })
								.then(command => {
									setTimeout(() => {
										client.interactions
											.createCommand(authorizeCommand, ID_SERVIDOR)
											.then(setToEnRole())
											.then(result => { console.log('Created authorize command') })
											.then(command => {
												setTimeout(() => {
													client.interactions
														.createCommand(desautorizarCommand, ID_SERVIDOR)
														.then(setToPtRole())
														.then(result => { console.log('Created desautorizar command') })
														.then(command => {
															setTimeout(() => {
																client.interactions
																	.createCommand(deauthorizeCommand, ID_SERVIDOR)
																	.then(setToEnRole())
																	.then(result => { console.log('Created deauthorize command') })
																	.then(command => {
																		setTimeout(() => {
																			client.interactions
																				.createCommand(bug, ID_SERVIDOR)
																				.then(setToEnRole())
																				.then(setToPTRole())
																				.then(result => { console.log('Created bug command') })
																				.then(command => {
																					setTimeout(() => {
																						client.interactions
																							.createCommand(helpCommand, ID_SERVIDOR)
																							.then(setToEnRole())
																							.then(result => { console.log('Created ajuda command') })
																							.then(command => {
																								setTimeout(() => {
																									client.interactions
																										.createCommand(ajudaCommand, ID_SERVIDOR)
																										.then(setToPtRole())
																										.then(result => { console.log('Created help command') })
																										.catch(error => {
																											console.log(error)
																											console.log(error.response.data)
																											console.log(error.response.data.errors.options['1'])
																										})
																								}, 4000)
																							})
																							.catch(error => {
																								console.log(error)
																								console.log(error.response.data)
																								console.log(error.response.data.errors.name)
																							})
																					}, 4000)
																				})
																				.catch(error => {
																					console.log(error)
																					console.log(error.response.data)
																					console.log(error.response.data.errors.name)
																				})
																		}, 4000)
																	})
																	.catch(error => {
																		console.log(error)
																		console.log(error.response.data)
																		console.log(error.response.data.errors.name)
																	})
															}, 4000)
														})
														.catch(error => {
															console.log(error)
															console.log(error.response.data)
															console.log(error.response.data.errors.name)
														})
												}, 4000)
											})
											.catch(error => {
												console.log(error)
												console.log(error.response.data)
												console.log(error.response.data.errors.name)
											})
									}, 4000)
								})
								.catch(error => {
									console.log(error)
									console.log(error.response.data)
									console.log(error.response.data.errors.name)
								})
						}, 4000)
					})
					.catch(error => {
						console.log(error)
						console.log(error.response.data)
						console.log(error.response.data.errors.name)
					})
			}, 4000)
		})
		.catch(error => {
			console.log(error)
			console.log(error.response.data)
			console.log(error.response.data.errors.name)
		})
}

function getCommands() {
	const ajudaCommand = {
		name: "ajuda",
		description: "Mostra informações sobre um comando de um dos meus plugins.",
		options: [
			{
				type: 3,
				required: true,
				name: 'commando',
				description: 'Qualquer comando dos meus plugins. Você pode usar termos como "setar casa", "cor da loja" também'
			}
		]
	}
	const helpCommand = {
		name: "help",
		description: "Displays informations about a command from one of my plugins.",
		options: [
			{
				type: 3,
				required: true,
				name: 'command',
				description: 'Any command from my plugins. You can use terms like "set a home", "shop color" too'
			}
		]
	}
	const bug = {
		name: "bug",
		description: "How to report bugs | Como reportar bugs"
	}
	const deauthorizeCommand = {
		name: "deauthorize",
		description: "Deauthorizes the IP that you authorized with /authorize.",
		options: [
			{
				type: 3,
				required: true,
				name: 'plugin',
				description: 'Choose the plugin you want to deauthorize.',
				choices: [
					{ name: 'BkDuel', value: 'BkDuel' },
					{ name: 'BkHash (Soon!)', value: 'BkHash' },
					{ name: 'BkAntiCommandTab (Soon!)', value: 'BkAntiCommandTab' },
					{ name: 'BkTeleport Premium (Soon!)', value: 'BkTeleportPro' }
				]
			}
		]
	}
	const desautorizarCommand = {
		name: "desautorizar",
		description: "Desautoriza o IP que você autorizou com /autorizar.",
		options: [
			{
				type: 3,
				required: true,
				name: 'plugin',
				description: 'Escolha o plugin que você quer desautorizar.',
				choices: [
					{ name: 'BkX1', value: 'BkDuel' },
					{ name: 'BkVelha (Em breve!)', value: 'BkHash' },
					{ name: 'BkAntiCommandTab (Em breve!)', value: 'BkAntiCommandTab' },
					{ name: 'BkTeleporte Premium (Em breve!)', value: 'BkTeleportPro' }
				]
			}
		]
	}
	const authorizeCommand = {
		name: "authorize",
		description: "Authorize your server's IP after buying the plugin.",
		options: [
			{
				type: 3,
				required: true,
				name: 'plugin',
				description: 'Choose the plugin you want to authorize the IP for.',
				choices: [
					{ name: 'BkDuel', value: 'BkDuel' },
					{ name: 'BkHash (Soon!)', value: 'BkHash' },
					{ name: 'BkAntiCommandTab (Soon!)', value: 'BkAntiCommandTab' },
					{ name: 'BkTeleport Premium (Soon!)', value: 'BkTeleportPro' }
				]
			},
			{
				type: 3,
				required: true,
				name: 'ip',
				description: "Type your server's IP address here."
			}
		]
	}
	const autorizarCommand = {
		name: "autorizar",
		description: "Autorize o IP do seu servidor depois de comprar o plugin.",
		options: [
			{
				type: 3,
				required: true,
				name: 'plugin',
				description: 'Escolha o plugin em que você deseja autorizar o IP.',
				choices: [
					{ name: 'BkX1', value: 'BkDuel' },
					{ name: 'BkVelha (Em breve!)', value: 'BkHash' },
					{ name: 'BkAntiCommandTab (Em breve!)', value: 'BkAntiCommandTab' },
					{ name: 'BkTeleporte Premium (Em breve!)', value: 'BkTeleportPro' }
				]
			},
			{
				type: 3,
				required: true,
				name: 'ip',
				description: 'Digite aqui o IP do seu servidor.'
			}
		]
	}
	const buyCommand = {
		name: "buy",
		description: "Use this command to buy a plugin."
	}
	const comprarCommand = {
		name: "comprar",
		description: "Use esse comando para comprar um plugin."
	}
	return { comprarCommand, buyCommand, autorizarCommand, authorizeCommand, desautorizarCommand, deauthorizeCommand, bug, helpCommand, ajudaCommand }
}

function setToPtRole() {
	return command => {
		client.interactions.editCommandPermissions(
			[
				{
					id: '805524037950373969',
					type: 1,
					permission: true,
				}
			], ID_SERVIDOR, command.id
		)
	}
}

function setToEnRole() {
	return command => {
		client.interactions.editCommandPermissions(
			[
				{
					id: '747513191059292240',
					type: 1,
					permission: true,
				}
			], ID_SERVIDOR, command.id
		)
	}
}

function configureExpress() {
	app.use(express.static('.'))
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(bodyParser.json())
}

function getConstants() {
	const ID_SERVIDOR = '741072931592994905'

	const usuarioRegistrado = new Schema({
		plugin: {
			type: String,
			required: true
		},
		userID: {
			type: String,
			required: true
		},
		allowedIP: {
			type: String,
			required: true
		}
	})

	const usuario = new Schema({
		discord_id: {
			type: String,
			required: true
		}
	})

	const usuarioComprando = new Schema({
		plugin: {
			type: String,
			required: true
		},
		discord_id: {
			type: String,
			required: true
		},
		channel_id: {
			type: String,
			required: true
		},
		currency: {
			type: String,
			required: false
		}
	})

	const pluginsComprados = new Schema({
		plugin: {
			type: String,
			required: true
		},
		discord_id: {
			type: String,
			required: true
		},
		payment_id: {
			type: String,
			required: true
		},
		cart: {
			type: String,
			required: true
		},
		payment_method: {
			type: String,
			required: true
		},
		email: {
			type: String,
			required: true
		},
		first_name: {
			type: String,
			required: true
		},
		last_name: {
			type: String,
			required: true
		},
		payer_id: {
			type: String,
			required: true
		},
		tax_id_type: {
			type: String,
			required: true
		},
		tax_id: {
			type: String,
			required: true
		},
		country_code: {
			type: String,
			required: true
		},
		payment_value: {
			type: String,
			required: true
		},
		currency: {
			type: String,
			required: true
		},
		recipient_name: {
			type: String,
			required: true
		},
		street: {
			type: String,
			required: true
		},
		city: {
			type: String,
			required: true
		},
		state: {
			type: String,
			required: true
		},
		postal_code: {
			type: String,
			required: true
		}
	})

	const UserRegistrado = mongoose.model('allowedIps', usuarioRegistrado)
	const Usuario = mongoose.model('usuario', usuario)
	const PluginsComprados = mongoose.model('plugins-comprados', pluginsComprados)
	const UsuarioComprando = mongoose.model('usuario-comprando', usuarioComprando)

	const uri = "mongodb+srv://bkstore:u7J5XauhQSfLG4@cluster0.whtpt.mongodb.net/allowedIps?retryWrites=true&w=majority" /* process.env.MONGODB_URI */

	const token = "NzQ3MTU4NjYwNzQ0MjE2Njc4.X0Kzug.r0PMdmsZI7oXLHUaQWtIWUnLI70"
	const prefix = '/'

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
			"nome": ["tpahere", "tpaqui"],
			"desc": ["Asks another player to teleport to you.", "Pede que outro jogador teleporte ate voce."],
			"uso": ["/tpahere <player>", "/tpaqui <jogador>"],
			"perm": "bkteleport.tpahere"
		},
		{
			"plugin": ["Bkteleport", "BkTeleporte"],
			"nome": ["tpaccept", "tpaceitar"],
			"desc": ["Accepts a teleport request", "Aceita o pedido de teleporte recebido"],
			"uso": ["/tpaccept <player>", "/tpaceitar <jogador>"],
			"perm": "bkteleport.tpaccept"
		},
		{
			"plugin": ["Bkteleport", "BkTeleporte"],
			"nome": ["tpdeny", "tpnegar"],
			"desc": ["Declines a teleport request", "Recusa o pedido de teleporte recebido"],
			"uso": ["/tpdeny <player>", "/tpnegar <jogador>"],
			"perm": "bkteleport.tpdeny"
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
			"perm": "bkshop.shops"
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

	const SUCESSO_COR = "#2AFF00"
	const ERRO_COR = "#FF1B00"
	const SITE_RETORNO = 'http://localhost:2526'
	const CANAL_REGISTRO = '748731824804462702'
	const CANAL_WELCOME = '838851994277904465'
	const BOT_ID = '747158660744216678'

	const pluginsCompraveis = {
		bkduel: {
			nome: ['BkDuel', 'BkDuel'],
			valor: ['8.00', '25.00', '7.00'],
			moeda: ['USD', 'BRL', 'EUR'],
			simbolo: ['$', 'R$', '€'],
			pagar_channel: ['838975029504901150', '839156596947943424'],
			categoria_channel: ['838800634286833776', '839156489511501894']
		}
	}

	const listaCmds = new Fuse(cmdsArray, options)
	return { token, prefix, CANAL_REGISTRO, CANAL_WELCOME, UsuarioComprando, SITE_RETORNO, uri, UserRegistrado, pluginsCompraveis, cmdsArray, listaCmds, PluginsComprados, ERRO_COR, SUCESSO_COR, ID_SERVIDOR }
}

async function howToBuyMessage(interaction) {
	const isEnglish = isEnglishMember(await fetchMember(interaction.guild_id, interaction.member.user.id))

	const title = isEnglish ? 'How to buy the plugin' : 'Como comprar o plugin'
	const desc = isEnglish ? 
		'To purchase the plugin simply type \'/buy\' here and the bot will guide you through the process in a private channel. \n\n**The purchase is automatic and is made entirely inside PayPal.**' :
		'Para comprar o plugin basta digitar \'/comprar\' aqui e o bot te guiará pelo processo em um canal privado. \n\n**A compra é automática e feita inteiramente dentro do Paypal.**' 
	client.guilds.cache.get(ID_SERVIDOR).channels.cache.get(pluginsCompraveis.bkduel.pagar_channel[isEnglish ? 0 : 1]).send(
		buildEmbed(false, interaction.author.user)
			.setDescription(desc)
			.setURL('')
			.setTitle(title)
			.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
	)
	interaction.reply('001')
}

async function languageSelectMessage(interaction) {
	interaction.reply({embeds: [
		new MessageEmbed()
		.setTitle(`Select your language | Selecione o seu idioma`)
		.setDescription('**\nTo begin, select your prefered language with the reactions bellow!\n\nPara começar, selecione o idioma que prefere nas reações abaixo!**')
		.setColor('#0443C1')
		.setURL('https://discord.gg/pVTjJT9mXZ')
		.addFields(
			{ name: '\u200B', value: '\u200B' },
			{ name: '**English**', value: 'Click the 🇺🇸 reaction bellow this message to set your language to English.', inline: true },
			{ name: '**Português**', value: 'Clique na reação 🇧🇷 abaixo dessa mensagem para colocar o seu idioma como Português.', inline: true },
			{ name: '\u200B', value: '\u200B' }
		)
		.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
		.setFooter('Bkr#1253 - http://bit.ly/bk-plugins')
	]})
		.then(message => {
			message.react('🇺🇸')
			return message
		})
		.then(message => {
			message.react('🇧🇷')
			return message
		})
		.catch(error => { console.log(error) })
}

function startBackend() {
	mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
		.then(result => {
			console.log('Banco de Dados Conectado')
			startPortListener()
			startAuthenticator()
			startPluginPaymentListeners()
			startPaypal()
			startInteractionListener()
		})
		.catch(err => { console.log(err) })
}

async function createAPIMessage(interaction, content) {
	const { data, files } = await Discord.APIMessage.create(
		client.channels.resolve(interaction.channel_id), content
	)
		.resolveData()
		.resolveFiles()
	return { ...data, files}
}

function getApp(guildId) {
	const app = client.api.applications(client.user.id)
	if (guildId) app.guilds(guildId)
	return app
}

function startInteractionListener() {
	app.post('/', (req, res) => {
		res.send('Awake!')
	})
}

function startAuthenticator() {
	app.get('/k1j2-39il-kjdc-ao03-90hf-a872', (req, res) => {
		const clientIp = req.headers['x-forwarded-for']
		const plugin = req.headers['plugin']
		const trueResponse = `true-${clientIp}`
		const falseResponse = `false-${clientIp}`
		UserRegistrado.find()
			.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.allowedIP == clientIp))
			.then(registros => registros.filter(registro => registro.plugin.toLowerCase() == plugin.toLowerCase()))
			.then(registroArray => {
				if (registroArray[0] !== undefined) {
					res.send({ resp: trueResponse })
				} else {
					res.send({ resp: falseResponse })
				}
			})
	})
}

function startPaypal() {
	paypal.configure({
		'mode': 'sandbox',
		'client_id': 'AWG9ajryIqdfuyjZL2zYcbq70MKj8X1jF6Xy4kXwnovU08Yk_BHkGBYkrUq1t03EqbdLWN4FfqGlLufI',
		'client_secret': 'EGtrgTRjv8w5vori_MtxMzQU0jy2u8ZLC4sbBRIqpYyub7LHxD5ubJ2ezKIO_CSTk2ozH3RBE-zEi97A'
	})
	console.log('PayPal Conectado')
}

function startPluginPaymentListeners() {
	startBkDuelPaymentListeners()
	
	app.get('/cancel', (req, res) => res.send('Cancelled'))
}

function startBkDuelPaymentListeners() {
	app.get('/success-bkduel-usd', (req, res) => {
		const payerId = req.query.PayerID
		const paymentId = req.query.paymentId
		const execute_payment_json = {
			"payer_id": payerId,
			"transactions": [{
				"amount": {
					"currency": "USD",
					"total": pluginsCompraveis.bkduel.valor[0]
				}
			}]
		}
		paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
			executePayment(error, payment, res)
		})
	})
	app.get('/success-bkduel-brl', (req, res) => {
		const payerId = req.query.PayerID
		const paymentId = req.query.paymentId
		const execute_payment_json = {
			"payer_id": payerId,
			"transactions": [{
				"amount": {
					"currency": "BRL",
					"total": pluginsCompraveis.bkduel.valor[1]
				}
			}]
		}
		paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
			executePayment(error, payment, res)
		})
	})
	app.get('/success-bkduel-eur', (req, res) => {
		const payerId = req.query.PayerID
		const paymentId = req.query.paymentId
		const execute_payment_json = {
			"payer_id": payerId,
			"transactions": [{
				"amount": {
					"currency": "EUR",
					"total": pluginsCompraveis.bkduel.valor[2]
				}
			}]
		}
		paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
			executePayment(error, payment, res)
		})
	})
}

function startPortListener() {
	app.get('/wakeup', (req, res) => {
		res.send('Awake!')
	})
	app.listen(process.env.PORT, '0.0.0.0', () => {
		console.log('Backend Ligado')
	})
}

function startStatusAnimation() {
	let status = false
	let prevNum = 0
	let ale = 0

	setInterval(() => {
		while (ale == prevNum)
			ale = Math.floor(Math.random() * cmdsArray.length)
		prevNum = ale
		if (status) {
			client.user.setActivity(`/help ${cmdsArray[ale].nome[0]}`, {
				type: 'PLAYING'
			})
			status = false
		} else {
			client.user.setActivity(`/ajuda ${cmdsArray[ale].nome[1]}`, {
				type: 'PLAYING'
			})
			status = true
		}
	}, 4000)
}

function cacheRegisterChannel() {
	client.channels.cache.get(CANAL_REGISTRO).messages.fetch(undefined, true)
	client.channels.cache.get(CANAL_WELCOME).messages.fetch(undefined, true)
}

function getPaymentInfo(emoji, pluginCompravel, userComprando) {
	let moeda = null
	let simbolo = null
	let valor = null
	switch (emoji.name) {
		case '🇺🇸':
			moeda = pluginCompravel.moeda[0]
			simbolo = pluginCompravel.simbolo[0]
			valor = pluginCompravel.valor[0]
			userComprando.set('currency', pluginCompravel.moeda[0])
			break
		case '🇧🇷':
			moeda = pluginCompravel.moeda[1]
			simbolo = pluginCompravel.simbolo[1]
			valor = pluginCompravel.valor[1]
			userComprando.set('currency', pluginCompravel.moeda[1])
			break
		case '🇪🇺':
			moeda = pluginCompravel.moeda[2]
			simbolo = pluginCompravel.simbolo[2]
			valor = pluginCompravel.valor[2]
			userComprando.set('currency', pluginCompravel.moeda[2])
			break
	}
	return { moeda, simbolo, valor }
}

function getCurrencyIndex(currency) {
	let currencyIndex = null

	switch (currency) {
		case 'USD':
			currencyIndex = 0
			break
		case 'BRL':
			currencyIndex = 1
			break
		case 'EUR':
			currencyIndex = 2
			break
	}
	return currencyIndex
}

function createPaymentJson(successUrl, cancelUrl, plugin_name, price, currency, discord_id) {
	return {
		"intent": "sale",
		"payer": {
			"payment_method": "paypal"
		},
		"redirect_urls": {
			"return_url": successUrl,
			"cancel_url": cancelUrl
		},
		"transactions": [{
			"item_list": {
				"items": [{
					"name": plugin_name,
					"sku": "001",
					"price": price,
					"currency": currency,
					"quantity": 1
				}]
			},
			"amount": {
				"currency": currency,
				"total": price
			},
			"description": discord_id
		}]
	}
}

async function comandoAjuda(interaction) {
	const isEnglish = isEnglishMember(await fetchMember(interaction.guild_id, interaction.member.user.id))
	const message = interaction
	const comandos = listaCmds.search(interaction.data.options[0].value)

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
			{embeds: [
				buildEmbed(false, interaction.author.user)
				.setURL('')
				.setTitle(title)
				.setDescription(`\u200b\n***${sugested}:*** \n*/${help} ${comandos[1] ? comandos[1].item.nome[key] : '-'} \u200b /${help} ${comandos[2] ? comandos[2].item.nome[key] : '-'} \u200b /${help} ${comandos[3] ? comandos[3].item.nome[key] : '-'} \u200b /${help} ${comandos[4] ? comandos[4].item.nome[key] : '-'}*\n\u200b\n`)
				.addFields(
					{ name: cmdTitle, value: `***Plugin***: ${comando.plugin[key]}\n***${desc}***: ${comando.desc[key]}\n***${usage}***: ${comando.uso[key]}\n***${perm}***: ${comando.perm}\n\u200b\n` }
				)
			]}
		)

	} else {
		let n = isEnglish ? 'Command not found' : 'Comando não encontrado'
		let v = isEnglish ? `The command '${interaction.data.options[0].value}' was not found, try again!\n\u200B` : `O comando '${interaction.data.options[0].value}' não foi encontrado, tente novamente!\n\u200B`

		message.reply(
			{embeds: [
				buildEmbed(true, interaction.author.user)
				.setURL('')
				.setTitle(title)
				.addFields(
					{ name: n, value: v }
				)
			]}
		)
	}
}

async function comandoBug(interaction) {
	const isEnglish = isEnglishMember(await fetchMember(interaction.guild_id, interaction.member.user.id))
	const message = interaction

	let title = isEnglish ? 'How To Report A Bug' : 'Como Reportar Um Bug'
	let titl = isEnglish ? `Hi there, i'm here to help!` : `Olá, eu estou aqui para ajudar!`
	let cmdTitle = isEnglish ? `To ensure the problem is properly described, plese fill the form bellow with the details of the bug.` : `Para garantir que o problema seja descrito de forma correta, preencha o formulário abaixo com os detalhes do bug.`
	let desc = isEnglish ? 'Short description of the problem' : 'Pequena descrição do problema'
	let usage = isEnglish ? 'Did you try to do anything to fix it? If yes, what?' : 'Você tentou fazer algo para arrumar o bug? Se sim, o que?'
	let perm = isEnglish ? 'Do you use any of my other plugins? If yes, which one?' : 'Você usa algum dos meus outros plugins? Se sim, qual?'
	let help = isEnglish ? 'Was there an error in the console? If yes, send a screenshot of it' : 'Teve algum erro no console? Se sim, mande uma foto dele'

	message.reply(
		buildEmbed(false, interaction.author.user)
			.setURL('')
			.addFields(
				{ name: `\u200b\n${titl}`, value: cmdTitle },
				{ name: '\u200b', value: `**Plugin**:\n**${desc}**:\n**${usage}**:\n**${perm}**:\n**${help}**:\n\u200b\n` }
			)
			.setTitle(title)
			.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
	)
}

async function hasValidOptions(interaction, amount) {
	let returnValue = false
	for (let c = 0; c < amount; c++) {
		if (!interaction.data.options[c]) {
			returnValue = false
			break;
		} else {
			returnValue = true
		}
	}
	if (returnValue == false) {
		const isEnglish = isEnglishMember(await fetchMember(interaction.guild_id, interaction.member.user.id))
		interaction.reply(buildEmbed(true, interaction.author.user).setURL('').setTitle(isEnglish ? 'Invalid Options' : 'You didn\'t type the required options').setDescription(isEnglish ? 'Opções inválidas\n\u200B' : 'Você não digitou as opções nescessárias\n\u200B'))
	}
	return returnValue
}

async function comandoDesautorizar(interaction) {
	const isEnglish = isEnglishMember(await fetchMember(interaction.guild_id, interaction.member.user.id))
	const message = interaction
	let pl = interaction.data.options[0].value.toLowerCase()
	UserRegistrado.find()
		.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.userID == message.member.user.id))
		.then(registros => registros.filter(registro => registro.plugin.toLowerCase() == pl))
		.then(registroArray => {
			if (registroArray[0] === undefined) {
				message.reply({embeds: [
					buildEmbed(true, interaction.author.user).setTitle(isEnglish ? 'Error' : 'Erro').setURL('').setDescription(isEnglish ? `You don\'t have an authorization for the plugin **${pl}**\n\u200B` : `Você não tem uma autorização no plugin **${pl}**\n\u200B`)
				]})
			} else {
				const ip = registroArray[0].allowedIP
				registroArray[0].remove()
				message.reply({embeds: [
					buildEmbed(false, interaction.author.user).setTitle(isEnglish ? 'Success' : 'Sucesso').setURL('').setDescription(isEnglish ? `You removed the authorization of the IP **${ip}** from the plugin **${pl}**\n\u200B` : `Você retirou a sua atorização do ip **${ip}** no plugin **${pl}**\n\u200B`)
				]})
			}
		})
		.catch(err => {
			console.log(err)
			message.reply(err | 'Error')
		})
}

async function comandoAutorizar(interaction) {
	const member = await fetchMember(interaction.guild_id, interaction.member.user.id)
	const isEnglish = isEnglishMember(member)
	const message = interaction
	let pl = interaction.data.options[0].value.toLowerCase()
	let ip = interaction.data.options[1].value
	let role = null
	switch (pl) {
		case 'bkduel':
			role = ['838925264426893373', '840984760809029643']
			break;
	}
	if (!role) {
		message.reply(buildEmbed(true, interaction.author.user).setURL('').setTitle(isEnglish ? 'No Permission' : 'Sem Permissão').setDescription(isEnglish ? 'You don\'t have permission to authorize this plugin.\n\u200B' : 'Você não tem permissão para autorizar esse plugin.\n\u200B'))
		return
	}
	
	if (member.roles.includes(role[0]) || member.roles.includes(role[1])) {
		UserRegistrado.find()
			.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.userID == message.member.user.id))
			.then(registros => registros.filter(registro => registro.plugin == pl))
			.then(registroArray => {
				if (registroArray[0] === undefined) {
					autorizarIp(pl, message, ip, isEnglish)
				} else {
					registroArray[0].remove()
						.then(result => {
							autorizarIp(pl, message, ip, isEnglish)
						})
						.catch(err => console.log(err))
				}
			})
			.catch(err => {
				console.log(err)
				message.reply(err | 'Error')
			})
		
	} else {
		message.reply(buildEmbed(true, interaction.author.user).setURL('').setTitle(isEnglish ? 'No Permission.' : 'Sem Permissão.').setDescription(isEnglish ? 'You don\'t have permission to authorize this plugin.\n\u200B' : 'Você não tem permissão para autorizar esse plugin.\n\u200B'))
	}

	/* if (args.length == 2) {
		
	} else if (args.length == 1) {
		message.reply({embeds: [
			buildEmbed(true).setTitle('Erro de sintaxe').setURL('').setDescription('Você não informou o IP.')
		]})
	} else {
		message.reply({embeds: [
			buildEmbed(true).setTitle('Erro de sintaxe').setURL('').setDescription('Use !autorizar <Plugin> <Ip>')
		]})
	} */
}

function autorizarIp(pl, message, ip, isEnglish) {
	const regUser = new UserRegistrado({
		plugin: pl,
		userID: message.member.user.id,
		allowedIP: ip
	})
	regUser.save()
		.then(result => {
			message.reply({
				embeds: [
					buildEmbed(false, message.author.user).setTitle(isEnglish ? 'Success' : 'Sucesso').setURL('').setDescription(isEnglish ? `You sucessfuly authorized the IP **${ip}** for the plugin **${pl}**!\n\u200B`: `Você autorizou o ip **${ip}** no plugin **${pl}** com sucesso!\n\u200B`)
				]
			})
		})
		.catch(err => {
			message.reply({
				embeds: [
					buildEmbed(true, message.author.user).setTitle(isEnglish ? 'Unexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription(err)
				]
			})
		})
}

async function comandoComprar(interaction) {
	const isEnglish = isEnglishMember(await fetchMember(interaction.guild_id, interaction.member.user.id))
	const message = interaction

	if (message.channel_id == pluginsCompraveis.bkduel.pagar_channel[0] || message.channel_id == pluginsCompraveis.bkduel.pagar_channel[1]) {
		PluginsComprados.find()
			.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.discord_id == message.member.user.id))
			.then(registros => registros.filter(registro => registro.plugin.toLowerCase() == isEnglish ? pluginsCompraveis.bkduel.nome[0].toLowerCase() : pluginsCompraveis.bkduel.nome[1].toLowerCase()))
			.then(registroArray => {
				if (registroArray[0] === undefined || registroArray.length == 0) {
					UsuarioComprando.find()
						.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.discord_id == message.member.user.id))
						.then(registros => registros.filter(registro => registro.plugin == isEnglish ? pluginsCompraveis.bkduel.nome[0].toLowerCase() : pluginsCompraveis.bkduel.nome[1].toLowerCase()))
						.then(registroArray => {
							if (registroArray[0] === undefined || registroArray.length == 0) {
								interaction.reply(isEnglish ? 'Starting purchase...' : 'Iniciando a compra...')
								startBuyAction(isEnglish, message, pluginsCompraveis.bkduel)
							} else {
								client.channels.fetch(registroArray[0].channel_id).then(channel => {
									if (channel != null) {
										channel.delete()
											.then(result => {
												registroArray[0].remove()
													.then(result => {
														interaction.reply(isEnglish ? 'Starting purchase...' : 'Iniciando a compra...')
														startBuyAction(isEnglish, message, pluginsCompraveis.bkduel)
													})
													.catch(err => console.log(err))
											})
									}
								})
							}
						})
						.catch(err => {
							console.log(err)
							interaction.reply(err || 'Error')
						})
				} else {
					interaction.reply({embeds: [
						buildEmbed(true, interaction.author.user).setTitle(isEnglish ? '**Error**' : '**Erro**').setURL('').setDescription(isEnglish ? 'Thanks, but you already bought this plugin!\n\u200B' : 'Obrigado, mas você já comprou este plugin!\n\u200B')
					]})
				}
			})
	} else {
		interaction.reply({
			embeds: [buildEmbed(true, interaction.author.user).setTitle(isEnglish ? '**Error**' : '**Erro**').setURL('').setDescription(isEnglish ? 'You are not in the "Buy" channel of any plugin!\n\u200B' : 'Você não está no canal "Comprar" de nenhum plugin!\n\u200B')]
		})
	}
}

function executePayment(error, payment, res) {
	if (error) {
		console.log(error.response)
	} else {
		const transaction = payment.transactions[0]
		const discord_id = transaction.description
		const pluginName = transaction.item_list.items[0].name.split(' ')[1]

		UsuarioComprando.find()
			.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.discord_id == discord_id))
			.then(registros => registros.filter(registro => registro.plugin.toLowerCase() == pluginName.toLowerCase()))
			.then(registroArray => {
				if (registroArray[0] != undefined && registroArray.length > 0) {
					client.channels.fetch(registroArray[0].channel_id).then(channel => {
						if (channel != null && channel != undefined) {
							const payerInfo = payment.payer.payer_info
							const payDate = payment.create_time.split('T')[0]
							const payTime = payment.create_time.split('T')[1]
							
							PluginsComprados.find()
								.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.discord_id == discord_id))
								.then(registros => registros.filter(registro => registro.plugin.toLowerCase() == pluginName.toLowerCase()))
								.then(registroArray => {
									if (registroArray[0] === undefined || registroArray.length == 0) {
										client.guilds.cache.get(ID_SERVIDOR).members.fetch(discord_id).then(member => {
											const isEnglish = isEnglishMember(member)
											salvarDadosPagamento(pluginName, discord_id, payment, payerInfo, transaction)
											const successTitle = [`**Purchase completed successfully!**`, `**Compra concluída com sucesso!**`]
											const successDescription = [`Congratulations <@${member.id}>, you bought the plugin **${pluginName}**!\n\nYou now have access to the **<#838833300847984691>** channel and the authorization command **/authorize BkDuel <ip>**\n\nTo activate your plugin simply use the command /authorize in the **<#805668906480042026>**. *Ex: /authorize BkDuel 192.168.1.10* \n\n*(Keep in mind that you can only authorize one IP at a time for each plugin, but you can reauthorize the IP how many times you want)*.\n\nA copy of this message has been sent to you.\n\n\n**Payer Info:**`, `Parabéns <@${member.id}>, você comprou o plugin **${pluginName}**!\n\nVocê agora tem acesso ao canal **<#839156572667248650>** e ao comando de autorização **/autorizar BkDuel <ip>**\n\nPara ativar o seu plugin basta usar o comando /autorizar no canal **<#747496262441369640>**. *Ex: /autorizar BkDuel 192.168.1.10* \n\n*(Tenha em mente que você só pode autorizar um IP por vez em cada plugin, mas você poderá reautorizar o IP quantas vezes quiser)*.\n\nUma cópia dessa mensagem foi enviada para você.\n\n\n**Informações do comprador:**`]
											
											const nome = ['Name', 'Nome']
											const pais = ['Country', 'País']
											const valor = ['Value', 'Valor']
											const moeda = ['Currency', 'Moeda']
											const id = ['Payer ID', 'ID Pagador']
											const criacao = ['Creation Date', 'Data da Criação']
											const pag_id = ['Payment ID', 'ID do Pagamento']
											
											member.roles.add(getPurchasedRole(pluginName, isEnglish))

											const mens = new MessageEmbed()
												.setTitle(isEnglish ? successTitle[0] : successTitle[1])
												.setDescription(isEnglish ? successDescription[0] : successDescription[1])
												.setColor('#2AFF00')
												.setURL('')
												.addFields(
													{ name: `**${isEnglish ? nome[0] : nome[1]}**`, value: `${payerInfo.first_name} ${payerInfo.last_name}`, inline: true },
													{ name: `**${isEnglish ? pais[0] : pais[1]}**`, value: `${payerInfo.country_code}`, inline: true },
													{ name: '\u200B', value: '\u200B', inline: true },
													{ name: `**${isEnglish ? valor[0] : valor[1]}**`, value: `${transaction.item_list.items[0].price}`, inline: true },
													{ name: `**${isEnglish ? moeda[0] : moeda[1]}**`, value: `${transaction.item_list.items[0].currency}`, inline: true },
													{ name: '\u200B', value: '\u200B', inline: true },
													{ name: `**${isEnglish ? id[0] : id[1]}**`, value: `${payerInfo.payer_id}`, inline: true },
													{ name: '**Email**', value: `${payerInfo.email}`, inline: true },
													{ name: '\u200B', value: '\u200B', inline: true },
													{ name: `**${isEnglish ? criacao[0] : criacao[1]}**`, value: `${payDate} | ${payTime}`, inline: true },
													{ name: `**${isEnglish ? pag_id[0] : pag_id[1]}**`, value: `${payment.id.replace('PAYID-', '')}`, inline: true },
													{ name: '\u200B', value: '\u200B', inline: true }
												)
												.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
											channel.send(mens)
											member.send(mens)
										})
									}
								})
							res.send('Success')
						}
					})
				}
			})
			.catch(err => console.log(err))
	}
}

function getPurchasedRole(pluginName, isEnglish) {
	const guild = client.guilds.cache.get(ID_SERVIDOR)
	let returnValue = null
	switch (pluginName.toLowerCase()) {
		case 'bkduel':
			returnValue = isEnglish ? guild.roles.cache.get('838925264426893373') : guild.roles.cache.get('840984760809029643')
			break;
	}

	return returnValue
}

function salvarDadosPagamento(pluginName, discord_id, payment, payerInfo, transaction) {
	const compra = new PluginsComprados({
		plugin: pluginName || 'null',
		discord_id: discord_id || 'null',
		payment_id: payment.id || 'null',
		cart: payment.cart || 'null',
		payment_method: payment.payer.payment_method || 'null',
		email: payerInfo.email || 'null',
		first_name: payerInfo.first_name || 'null',
		last_name: payerInfo.last_name || 'null',
		payer_id: payerInfo.payer_id || 'null',
		tax_id_type: payerInfo.tax_id_type || 'null',
		tax_id: payerInfo.tax_id || 'null',
		country_code: payerInfo.country_code || 'null',
		payment_value: transaction.item_list.items[0].price || 'null',
		currency: transaction.item_list.items[0].currency || 'null',
		recipient_name: transaction.item_list.shipping_address.recipient_name || 'null',
		street: transaction.item_list.shipping_address.line1 || 'null',
		city: transaction.item_list.shipping_address.city || 'null',
		state: transaction.item_list.shipping_address.state || 'null',
		postal_code: transaction.item_list.shipping_address.postal_code || 'null',
	})
	compra.save().catch(err => { console.log(err) })
}

function getPluginCompravel(channelName) {
	switch (channelName.toLowerCase()) {
		case 'bkduel':
			return pluginsCompraveis.bkduel
	}
	return null
}

function startBuyAction(isEnglish, message, pluginCompravel) {
	client.channels.fetch(isEnglish ? pluginCompravel.categoria_channel[0]: pluginCompravel.categoria_channel[1]).then(category => {
		message.guild.channels.create(`${message.member.user.id}-${isEnglish ? pluginCompravel.nome[0].toLowerCase() : pluginCompravel.nome[1].toLowerCase()}`, {
			type: "text",
			parent: category,
			permissionOverwrites: privateChannelOverwrite(message)
		})
			.then(channel => {
				const pluginNome = isEnglish ? pluginCompravel.nome[0] : pluginCompravel.nome[1]
				const regUser = new UsuarioComprando({
					plugin: pluginNome,
					discord_id: message.member.user.id,
					channel_id: channel.id
				})
				regUser.save()
					.then(async result => {
						const isEnglish = isEnglishMember(await fetchMember(message.guild_id, message.member.user.id))

						const private_channel_title = ['Private Channel', 'Canal Privado']
						const private_channel_desc = [`Hey <@${message.member.user.id}>, i'm here! \n\nOnly you can see this channel, it will be deleted automatically after 7 days...`, `Ei <@${message.member.user.id}>, eu estou aqui! \n\nSó você pode visualizar esse canal, ele será deletado automaticamente após 7 dias...`]
						const starting_title = [`Starting purchase of the plugin ${pluginCompravel.nome[0]}`, `Iniciando a compra do plugin ${pluginCompravel.nome[1]}`]
						const starting_desc = [`\nThe proccess is very simple and 100% automatic, you don't have to send me any payment receipt to receive your plugin.\n\nYou will get access to the plugin download and the activation command instantaneously after the purchase is complete.\n\nLet's go: To begin, select your currency in the reactions bellow'`, `\nO processo é bem simples e 100% automático, sem ter que ficar enviando comprovantes pra lá e pra cá\n\nVocê receberá o acesso ao download do plugin e ao comando de ativação instantaneamente após a confirmação do pagamento\n\nVamos lá: pra começar, selecione a sua moeda nas reações abaixo'`]

						channel.send(new MessageEmbed()
							.setTitle(`${isEnglish ? private_channel_title[0] : private_channel_title[1]}`)
							.setDescription(`${isEnglish ? private_channel_desc[0] : private_channel_desc[1]}`)
							.setColor('#0443C1')
							.setURL('')
							.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
						)
							.then(result => {
								message.delete()
								channel.send(new MessageEmbed()
									.setTitle(`${isEnglish ? starting_title[0] : starting_title[1]}`)
									.setDescription(`${isEnglish ? starting_desc[0] : starting_desc[1]}`)
									.setColor('#0443C1')
									.setURL('')
									.addFields(
										{ name: '\u200B', value: '\u200B' },
										{ name: '**USD | US Dollar**', value: 'Click the 🇺🇸 reaction bellow this message to set the currency to USD.', inline: true },
										{ name: '**BRL | Real Brasileiro**', value: 'Clique na reação 🇧🇷 abaixo dessa mensagem para definir a moeda como BRL.', inline: true },
										{ name: '**EUR | European Euro**', value: 'Click the 🇪🇺 reaction bellow this message to set the currency to EUR.', inline: true }
									)
									.setThumbnail('https://i.imgur.com/aWQ9aBT.png')
								)
									.then(message => {
										message.react('🇺🇸')
										return message
									})
									.then(message => {
										message.react('🇧🇷')
										return message
									})
									.then(message => {
										message.react('🇪🇺')
										return message
									})
									.catch(error => { console.log(error) })
							})
					})
					.catch(err => {
						message.reply({embeds: [buildEmbed(true, interaction.author.user).setTitle(isEnglish ? 'Unnexpected error, contact **Bkr#1253**' : 'Erro Inexperado, entre em contato com **Bkr#1253**').setURL('').setDescription(err)]})
						console.log(err)
					})
			})
	})
}

function privateChannelOverwrite(message) {
	return [
		{
			id: message.guild.roles.everyone.id,
			type: 'role',
			deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
		},
		{
			id: `${message.member.user.id}`,
			type: 'member',
			allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
		}
	]
}

async function isPrivateUserChannel(user, channel_id, pluginName) {
	let returnValue = false
	if (!pluginName) return false
	await UsuarioComprando.find()
		.then(mongoUsers => mongoUsers.filter(userRegistrado => userRegistrado.discord_id == user.id))
		.then(registros => registros.filter(registro => registro.plugin.toLowerCase() == pluginName.toLowerCase()))
		.then(registroArray => {
			returnValue = registroArray[0] != undefined ? registroArray[0].channel_id == channel_id : false
		})
		.catch(err => {
			console.log(err)
		})
	return returnValue
}

async function isSafeMessage(message) {
	const cont = [
		/* 'www.',
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
		'. gg', */
		'discord.gg',
		'discord . gg',
		/* 'discord.',
		'discord .',
		'discordapp.',
		'discordapp .', */
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

	const isEnglish = isEnglishMember(await fetchMember(interaction.guild_id, interaction.member.user.id))

	const titulo = isEnglish ? `You can't do that, @${message.author.username}!` : `Você não pode fazer isso, @${message.author.username}!`
	const desc = isEnglish ? 'A link was detected in your message and you will be punished if you continue to send it.\n\u200B' : 'Um link foi detectado na sua mensagem e você será punido se continuar a envia-lo.\n\u200B'
	//const procurarLink = new Fuse(links, options)

	const notSafe = () => {
		message.reply({embeds: [
			buildEmbed(true, interaction.author.user)
			.setURL('')
			.setTitle(titulo)
			.setDescription(desc)]})
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

	/* message.content.trim().replace('/', ' ').replace('.', ' ').replace('-', ' ').replace('_', ' ').replace(',', ' ').replace('', ' ').replace(':', ' ').replace('~', ' ').replace('\'', ' ').replace('\"', ' ').split(/ +/).forEach(word => {
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

function buildEmbed(isError, user) {
	let cor = isError || false
	cor = isError ? ERRO_COR : SUCESSO_COR

	return new MessageEmbed()
		.setTitle(`Placeholder title`)
		.setColor(cor)
		.setURL('https://discord.gg/pVTjJT9mXZ')
		.setFooter(` • ${user.tag}`, user.displayAvatarURL({ format: 'png', size: 16 }))
		.setTimestamp(new Date())
}

function getLanguage(member) {
	let comparison = !member.roles.cache ? member.roles.includes('805524037950373969') : member.roles.cache.some(role => role.id == '805524037950373969')
	return comparison ? 'Portugues' : 'English'
}

function isEnglishMember(member) {
	return getLanguage(member) == 'English'
}

function ptMsg(user) {
	return new MessageEmbed()
		.setTitle(`Bem-vindo(a)!`)
		.setDescription(`Seja bem-vindo(a) ao BkStore, <@${user.id}>! Nesse servidor você pode encomendar, comprar e receber suporte para meus plugins!`)
		.setColor('#0443C1')
		.setURL('https://discord.gg/pVTjJT9mXZ')
		.addFields(
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Suporte para Erros', value: 'Poste o seu problema no canal #Bugs do plugin em que você deseja receber ajuda.' },
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Sugestões são sempre bem-vindas', value: 'Deixe suas sugestões sobre o que eu posso melhorar nos plugins no canal #Sugestões.' },
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Regras', value: 'No canal <#747495985378361356> você encontrará as regras do servidor.', inline: true },
			{ name: 'Encomendar Plugins', value: 'Aqui no <#778332211090423838> você pode encomendar plugins.', inline: true },
			{ name: 'Comandos', value: 'O canal <#747496262441369640> contém uma lista de todos os comandos disponíveis no servidor.', inline: true },
			{ name: '\u200B', value: '\u200B' },
		)
		.setThumbnail(user.avatarURL())
		.setFooter('Bkr#1253 - Meus plugins: http://bit.ly/bk-plugins')
}

function engMsg(user) {
	return new MessageEmbed()
		.setTitle(`Welcome!`)
		.setDescription(`Welcome to BkStore, <@${user.id}>! In this server can order, buy and receive support for my plugins!`)
		.setColor('#0443C1')
		.setURL('https://discord.gg/pVTjJT9mXZ')
		.addFields(
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Error Support', value: 'Post you problem in the #Bugs channel from the plugin you wish to receive help for.' },
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Sugestions are always welcome', value: 'Leave your sugestions about what i can improve in the #Sugestions channel.' },
			{ name: '\u200B', value: '\u200B' },
			{ name: 'Rules', value: 'In the channel <#747495985378361356> you will be able to find the server rules.', inline: true },
			{ name: 'Order Plugins', value: 'Here in the channel <#805668197457592341> you can order plugins.', inline: true },
			{ name: 'Commands', value: 'The channel <#805668906480042026> contains a list of all available commands in the server.', inline: true },
			{ name: '\u200B', value: '\u200B' },
		)
		.setThumbnail(user.avatarURL())
		.setFooter('#Bkr1253 - My plugins: http://bit.ly/bk-plugins')
}
