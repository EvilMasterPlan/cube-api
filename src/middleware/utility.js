const charactersAlphaNumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const charactersReadableAlphaNumeric = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const dayjs = require('dayjs');
var duration = require('dayjs/plugin/duration');
dayjs.extend(duration);

const dawnOfTime = dayjs('2020-01-01T00:00:00.000Z');

module.exports.generateItemID = (prefix) => {
	let randomString = '';
	for (let i = 0; i < 5; i++) {
		const randomChar = charactersReadableAlphaNumeric[Math.floor(Math.random() * charactersReadableAlphaNumeric.length)];
		randomString += randomChar;
	}

	const now = dayjs();
	const secondsSinceDawnOfTime = Math.round(dayjs.duration(now.diff(dawnOfTime)).asMilliseconds());
	let timeString = `${secondsSinceDawnOfTime}`;
	if (timeString.length == 11) {
		timeString = '0' + timeString;
	}

	let id = `${timeString}${prefix}${randomString}`;

	return id;
}

module.exports.randomAlphaNumericString = function(length=6) {
	let randomString = '';
	for (let i=0; i<length; i++) {
		const randomChar = charactersReadableAlphaNumeric[Math.floor(Math.random() * charactersReadableAlphaNumeric.length)];
		randomString += randomChar;
	}
	return randomString;
}

module.exports.randomItemID = function(type) {
	let randomString = '';

	let typeChar = '';
	const isDefault = (type == null);

	switch(type) {
		case 'note':
			typeChar = 'N';
			break;
		case 'atom':
			typeChar = 'A';
			break;
		case 'link':
			typeChar = 'L';
			break;
		case 'guide':
			typeChar = 'G';
			break;
		case 'term':
			typeChar = 'T';
			break;
		case 'q&a':
			typeChar = 'Q';
			break;
		case 'context':
			typeChar = 'CN';
			break;
		case 'dark-matter':
			typeChar = 'CD';
			break;
		default:
			break;
	}

	const length = isDefault ? 8 : 7;
	for (let i=0; i<length; i++) {
		const randomChar = charactersReadableAlphaNumeric[Math.floor(Math.random() * charactersReadableAlphaNumeric.length)];
		randomString += randomChar;
	}
	return isDefault ? randomString : `${typeChar}_${randomString}`;
}

module.exports.inferItemType = function(itemID) {
	let type, archType, prefix;
	let temporary = false;

	if (itemID && itemID.length > 0) {
		const components = itemID.split('_');

		if (itemID.startsWith('_')) {
			temporary = true;
			prefix = components.length > 1 ? components[1] : itemID[1];
		} else {
			prefix = components.length > 0 ? components[0] : itemID[0];
		}
	}

	switch(prefix) {
		case 'A':
			type = 'atom';
			archType = 'atom';
			break;
		case 'N':
			type = 'note';
			archType = 'note';
			break;
		case 'L':
			type = 'link';
			archType = 'fragment';
			break;
		case 'G':
			type = 'guide';
			archType = 'fragment';
			break;
		case 'T':
			type = 'term';
			archType = 'fragment';
			break;
		case 'Q':
			type = 'q&a';
			archType = 'fragment';
			break;
		case 'CN':
			type = 'context';
			archType = 'context';
			break;
		default:
			break;
	}

	return {
		type: type,
		archType: archType,
		temporary: temporary
	};
}

module.exports.bifurcate = (list, splitter) => {
	const positive = list.filter((item) => splitter(item));
	const negative = list.filter((item) => !splitter(item));
	return [positive, negative];
} 