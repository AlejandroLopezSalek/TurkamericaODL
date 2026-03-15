const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DailyWord = require('../models/DailyWord');

async function fixMarch14() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.error('MONGO_URI or MONGODB_URI not found in env');
            process.exit(1);
        }

        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Look for the entry on March 14th
        const targetDate = '2026-03-14';
        const wod = await DailyWord.findOne({ date: { $regex: '^' + targetDate } });

        if (wod && wod.translations) {
            console.log('Found WoD for March 14. Checking translations Map...');
            
            // Get Spanish translation
            const esData = wod.translations.get('es');
            
            if (esData) {
                console.log('Current word in ES:', esData.word);
                // Based on user report: word is "rüzgar" but content is wrong
                esData.word = 'rüzgar';
                esData.translation = 'viento';
                esData.pronunciation = 'rüz-gar';
                esData.example = 'Bugün rüzgar çok sert esiyor.';
                esData.example_translation = 'Hoy el viento sopla muy fuerte.';
                esData.level = 'A2 - Pre-intermedio';
                esData.tip = 'Rüzgar significa viento en turco.';

                wod.translations.set('es', esData);
                wod.markModified('translations');
                await wod.save();
                console.log('Fixed March 14 WoD successfully.');
            } else {
                console.log('No ES translation found. Creating one...');
                wod.translations.set('es', {
                    word: 'rüzgar',
                    translation: 'viento',
                    pronunciation: 'rüz-gar',
                    example: 'Dışarıda rüzgar var.',
                    example_translation: 'Hay viento afuera.',
                    level: 'A2 - Pre-intermedio',
                    tip: 'Rüzgar significa viento.'
                });
                wod.markModified('translations');
                await wod.save();
                console.log('Added March 14 WoD ES translation.');
            }
        } else {
            console.log('No WoD entry or translations map found for March 14.');
            // If it doesn't exist, create it
            if (!wod) {
                 await DailyWord.create({
                    date: targetDate,
                    translations: new Map([['es', {
                        word: 'rüzgar',
                        translation: 'viento',
                        pronunciation: 'rüz-gar',
                        example: 'Dışarıda rüzgar var.',
                        example_translation: 'Hay viento afuera.',
                        level: 'A2 - Pre-intermedio',
                        tip: 'Rüzgar significa viento.'
                    }]])
                });
                console.log('Created new entry for March 14.');
            }
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (err) {
        console.error('Error fixing March 14 WoD:', err);
    }
}

fixMarch14();
