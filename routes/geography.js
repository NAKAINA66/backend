const express = require('express');
const router = express.Router();

// Provinces data - Synchronisé avec js/geography.js
const provincesData = [
    { name: "Batha", prefectures: ["Ati", "Djedda", "Fitri"] },
    { name: "Borkou", prefectures: ["Borkou", "Borkou Yala"] },
    { name: "Chari-Baguirmi", prefectures: ["Baguirmi", "Chari", "Loug Chari"] },
    { name: "Ennedi-EST", prefectures: ["Amdjarass", "Wadi Hawar", "Itou"] },
    { name: "Ennedi-OUEST", prefectures: ["Fada", "Kobé"] },
    { name: "Guéra", prefectures: ["Abtouyour", "Barh Signaka", "Guéra"] },
    { name: "Hadjer-Lamis", prefectures: ["Dagana", "Daru", "Haraze Al Biar"] },
    { name: "Kanem", prefectures: ["Kanem", "Nord Kanem"] },
    { name: "Lac", prefectures: ["Mamdi", "Wayi"] },
    { name: "Logone-Occidental", prefectures: ["Dodjé", "Guéni", "Lac Wey", "Ngourkosso"] },
    { name: "Logone-Oriental", prefectures: ["La Nya Pendé", "Monts de Lam", "Nya", "Pendé", "Tandjilé Est"] },
    { name: "Mandoul", prefectures: ["Barh Sara", "Mandoul Occidental", "Mandoul Oriental", "Mandoul Central", "Moyen-Chari", "Tandjilé Ouest"] },
    { name: "Mayo-Kebbi-Est", prefectures: ["Bongor", "Gounou Gaya", "Kabbia", "Mont Illi", "Mayo Boneye", "Mayo Dallah"] },
    { name: "Mayo-Kebbi-Ouest", prefectures: ["Léré", "Mayo Binder", "Mayo Kébbi", "Mayo Louti", "Mayo Rey", "Mayo Wessé"] },
    { name: "Moyen-Chari", prefectures: ["Barh Köh", "Grande Sido", "Lac Iro"] },
    { name: "N'Djamena", prefectures: ["N'Djamena"] },
    { name: "Ouaddaï", prefectures: ["Assoungha", "Djourf Al Ahmar", "Ouara"] },
    { name: "Salamat", prefectures: ["Aboudeïa", "Barh Azoum", "Haraze Al Biar"] },
    { name: "Sila", prefectures: ["Djourf Al Ahmar", "Kimiti", "Koukou Angarana", "Tissi"] },
    { name: "Tandjilé", prefectures: ["Tandjilé Est", "Tandjilé Ouest"] },
    { name: "Tibesti", prefectures: ["Tibesti Est", "Tibesti Ouest"] },
    { name: "Wadi-Fira", prefectures: ["Biltine", "Dar Tama", "Kobé", "Mourdi"] },
    { name: "Barh El Gazel", prefectures: ["Barh El Gazel Nord", "Barh El Gazel Sud", "Barh El Gazel Ouest", "Barh El Gazel Est", "Kleta"] }
];

router.get('/provinces', async (req, res) => {
    try {
        const provinces = provincesData.map(p => ({
            name: p.name,
            prefectures: p.prefectures
        }));
        res.json({ success: true, provinces });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/prefectures/:province', async (req, res) => {
    try {
        // Décoder le nom de la province (peut contenir des caractères spéciaux)
        const provinceName = decodeURIComponent(req.params.province);
        const province = provincesData.find(p => p.name === provinceName || p.name === req.params.province);
        if (!province) {
            return res.status(404).json({ success: false, message: 'Province non trouvée' });
        }
        res.json({ success: true, prefectures: province.prefectures });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

