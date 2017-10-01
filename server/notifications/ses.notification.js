const NOTIFICATION_NAME = 'SESNotification';
const DEFAULT_REGION = 'us-east-1';

const logger = require('winston');
const assert = require('assert');
const nodemailer = require('nodemailer');
const moment = require('moment');
const proxy = require('proxy-agent');
const sesTransport = require('nodemailer-ses-transport');

class SESNotification {
	constructor(params, baseUrl) {
		assert(
			params && params.accessKeyId && params.secretAccessKey && params.to,
			'SESNotification constructor expected "accessKeyId", "secretAccessKey" and "to" params'
		);

		const config = {
			transport: 'ses',
			accessKeyId: params.accessKeyId,
			secretAccessKey: params.secretAccessKey,
			region: params.region || DEFAULT_REGION
		};

		if (params.proxy) config.httpOptions = { agent: proxy(params.proxy) };

		this.transporter = nodemailer.createTransport(sesTransport(config));

		this._from = params.from || '"Fox"';
		this._to = params.to;
		this._baseUrl = baseUrl;
	}

	static get name() {
		return NOTIFICATION_NAME;
	}

	send(metricName, setsOfDatapoints) {
		this.sendRaw(
			`Anomalies found for ${metricName}`,
			this.generateHTMLBody(metricName, setsOfDatapoints)
		).catch(error => logger.error(error));
	}

	sendRaw(subject, body) {
		return new Promise((resolve, reject) => {
			const mailOptions = {
				subject,
				from: this._from,
				to: this._to.join(','),
				text: 'Open HTML version of email',
				html: body
			};

			logger.debug(
				`Sending SESNotification notification: "${mailOptions.subject}" to ${this._to.join(
					', '
				)}`
			);
			this.transporter.sendMail(mailOptions, error => {
				if (error) {
					return reject(error);
				}
				logger.debug(
					`${NOTIFICATION_NAME} notification sent: "${mailOptions.subject}" to ${this._to.join(
						', '
					)}`
				);
				resolve();
			});
		});
	}

	generateHTMLBody(metricName, setsOfDatapoints) {
		let html = `<h1>Metric "${metricName}"</h1>`;

		html += setsOfDatapoints
			.map(setOfDatapoints => {
				const max = Math.max.apply(
					null,
					setOfDatapoints.map(i => i.value)
				);

				return (
					'<h3>Anomaly found</h3><table>' +
					setOfDatapoints
						.map(item => {
							return `
					<tr>
						<td>${moment(item.timestamp).format('DD/MM, h:mm:ss a')}</td>
						<td width="200px">
							<div style="background-color:${item.isEvent
								? 'red'
								: 'grey'}; height: 10px; width: calc(${item.value}/${max} * 100%)"></div>
						</td>
						<td>${item.value}</td>
					</tr>
				`;
						})
						.join('\n') +
					'</table>'
				);
			})
			.join('\n');

		html += `<br><br><a href="${this
			._baseUrl}" target="_blank">Go to the web interface</a>`;

		return html;
	}
}

module.exports = SESNotification;
