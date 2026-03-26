import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Country from '#models/country'

export default class extends BaseSeeder {
    async run() {
        await Country.updateOrCreateMany('flag', [
            { name: 'India', code: '91', flag: 'in', phoneNumberLength: 10, isActive: true },
            { name: 'United States of America', code: '1', flag: 'us', phoneNumberLength: 10, isActive: true },
            { name: 'United Kingdom', code: '44', flag: 'gb', phoneNumberLength: 10, isActive: true },
            { name: 'United Arab Emirates', code: '971', flag: 'ae', phoneNumberLength: 9, isActive: true },
            { name: 'Australia', code: '61', flag: 'au', phoneNumberLength: 9, isActive: true },
            { name: 'Canada', code: '1', flag: 'ca', phoneNumberLength: 10, isActive: true },
            { name: 'Germany', code: '49', flag: 'de', phoneNumberLength: 10, isActive: true },
            { name: 'France', code: '33', flag: 'fr', phoneNumberLength: 9, isActive: true },
            { name: 'Singapore', code: '65', flag: 'sg', phoneNumberLength: 8, isActive: true },
            { name: 'Japan', code: '81', flag: 'jp', phoneNumberLength: 10, isActive: true },
            { name: 'China', code: '86', flag: 'cn', phoneNumberLength: 11, isActive: true },
            { name: 'Brazil', code: '55', flag: 'br', phoneNumberLength: 10, isActive: true },
            { name: 'South Africa', code: '27', flag: 'za', phoneNumberLength: 9, isActive: true },
            { name: 'Saudi Arabia', code: '966', flag: 'sa', phoneNumberLength: 9, isActive: true },
            { name: 'Qatar', code: '974', flag: 'qa', phoneNumberLength: 8, isActive: true },
            { name: 'Oman', code: '968', flag: 'om', phoneNumberLength: 8, isActive: true },
            { name: 'Kuwait', code: '965', flag: 'kw', phoneNumberLength: 8, isActive: true },
            { name: 'Bahrain', code: '973', flag: 'bh', phoneNumberLength: 8, isActive: true },
            { name: 'Nepal', code: '977', flag: 'np', phoneNumberLength: 10, isActive: true },
            { name: 'Sri Lanka', code: '94', flag: 'lk', phoneNumberLength: 10, isActive: true },
            { name: 'Bangladesh', code: '880', flag: 'bd', phoneNumberLength: 10, isActive: true },
            { name: 'Pakistan', code: '92', flag: 'pk', phoneNumberLength: 10, isActive: true },
            { name: 'Russia', code: '7', flag: 'ru', phoneNumberLength: 10, isActive: true },
            { name: 'Switzerland', code: '41', flag: 'ch', phoneNumberLength: 9, isActive: true },
            { name: 'Netherlands', code: '31', flag: 'nl', phoneNumberLength: 9, isActive: true },
            { name: 'Spain', code: '34', flag: 'es', phoneNumberLength: 9, isActive: true },
            { name: 'Italy', code: '39', flag: 'it', phoneNumberLength: 10, isActive: true },
            { name: 'Turkey', code: '90', flag: 'tr', phoneNumberLength: 10, isActive: true },
            { name: 'Malaysia', code: '60', flag: 'my', phoneNumberLength: 9, isActive: true },
            { name: 'Thailand', code: '66', flag: 'th', phoneNumberLength: 9, isActive: true },
            { name: 'Vietnam', code: '84', flag: 'vn', phoneNumberLength: 9, isActive: true },
            { name: 'Philippines', code: '63', flag: 'ph', phoneNumberLength: 10, isActive: true },
            { name: 'Indonesia', code: '62', flag: 'id', phoneNumberLength: 10, isActive: true }
        ])
    }
}
