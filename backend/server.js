const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

function normalize(str) {
    if (typeof str !== 'string') return '';
    let correctedStr = str
        .replace(/Pl\?stico/gi, 'Plastico')
        .replace(/M\?dio/gi, 'Medio');
    return correctedStr
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

const createDynamicConnection = async (dbConfig) => {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host, port: dbConfig.port || 3306, user: dbConfig.user,
            password: dbConfig.password, database: 'db_prod', charset: 'utf8mb4',
        });
        await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
        await connection.execute('SET CHARACTER SET utf8mb4');
        return connection;
    } catch (error) {
        console.error("Erro ao conectar no banco:", error.code);
        return null;
    }
};

app.post('/api/test-connection', async (req, res) => {
    const connection = await createDynamicConnection(req.body);
    if (connection) {
        await connection.end();
        res.status(200).send('Conexão bem-sucedida');
    } else {
        res.status(500).send('Falha na conexão');
    }
});

app.post('/api/dashboard-data', async (req, res) => {
    let connection;
    try {
        const { date, ...dbConfig } = req.body;
        if (!date) return res.status(400).json({ error: 'A data é obrigatória.' });
        connection = await createDynamicConnection(dbConfig);
        if (!connection) throw new Error('Falha na conexão com o banco.');
        
        const whereClause = `WHERE DATE(p.data_hora) = ?`;
        const [totalPecas] = await connection.execute(`SELECT COUNT(*) as total FROM tb_prod p ${whereClause}`, [date]);
        const [producaoHora] = await connection.execute(`SELECT HOUR(p.data_hora) as hora, COUNT(*) as quantidade FROM tb_prod p ${whereClause} GROUP BY HOUR(p.data_hora) ORDER BY hora`, [date]);
        
        const [materiaisRaw] = await connection.execute(`SELECT m.material, COUNT(p.id_prod) as quantidade FROM tb_material m LEFT JOIN tb_prod p ON p.material = m.id_material AND DATE(p.data_hora) = ? GROUP BY m.id_material, m.material`, [date]);
        const [coresRaw] = await connection.execute(`SELECT c.cor, COUNT(p.id_prod) as quantidade FROM tb_cor c LEFT JOIN tb_prod p ON p.cor = c.id_cor AND DATE(p.data_hora) = ? GROUP BY c.id_cor, c.cor`, [date]);
        const [tamanhosRaw] = await connection.execute(`SELECT t.tamanho, COUNT(p.id_prod) as quantidade FROM tb_tamanho t LEFT JOIN tb_prod p ON p.tamanho = t.id_tamanho AND DATE(p.data_hora) = ? GROUP BY t.id_tamanho, t.tamanho`, [date]);

        // Função de agregação corrigida para usar a normalização como chave
        const aggregateData = (data, keyField) => {
            const aggregated = data.reduce((acc, item) => {
                const originalName = item[keyField];
                const normalizedKey = normalize(originalName);

                if (!acc[normalizedKey]) {
                    // Armazena o nome original (o primeiro que aparecer) para manter a capitalização etc.
                    acc[normalizedKey] = { [keyField]: originalName, quantidade: 0 };
                }
                acc[normalizedKey].quantidade += item.quantidade;
                return acc;
            }, {});
            return Object.values(aggregated);
        };
        
        res.json({
            totalPecasHoje: totalPecas[0]?.total || 0,
            producaoHora: producaoHora || [],
            materiais: aggregateData(materiaisRaw, 'material').map(m => ({...m, material: m.material.charAt(0).toUpperCase() + m.material.slice(1)})),
            cores: aggregateData(coresRaw, 'cor'),
            tamanhos: aggregateData(tamanhosRaw, 'tamanho'),
        });
    } catch (error) {
        console.error('Erro no endpoint dashboard-data:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.post('/api/full-report', async (req, res) => {
    let connection;
    try {
        const { startDate, endDate, ...dbConfig } = req.body;
        if (!startDate || !endDate) return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
        connection = await createDynamicConnection(dbConfig);
        if (!connection) throw new Error('Falha na conexão com o banco.');
        const [reportData] = await connection.execute(`SELECT p.id_prod as ID, p.data_hora as 'Data e Hora', c.cor as Cor, m.material as Material, t.tamanho as Tamanho FROM tb_prod p JOIN tb_cor c ON p.cor = c.id_cor JOIN tb_material m ON p.material = m.id_material JOIN tb_tamanho t ON p.tamanho = t.id_tamanho WHERE DATE(p.data_hora) BETWEEN ? AND ? ORDER BY p.data_hora DESC`, [startDate, endDate]);
        res.json(reportData);
    } catch (error) {
        console.error('Erro no endpoint full-report:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.post('/api/filtered-report', async (req, res) => {
    let connection;
    try {
        const { startDate, endDate, ...dbConfig } = req.body;
        if (!startDate || !endDate) return res.status(400).json({ error: 'As datas são obrigatórias.' });
        connection = await createDynamicConnection(dbConfig);
        if (!connection) throw new Error('Falha na conexão com o banco.');
        const [prodMat] = await connection.execute(`SELECT DATE_FORMAT(p.data_hora, '%d/%m') as dia, m.material, COUNT(*) as quantidade FROM tb_prod p JOIN tb_material m ON p.material = m.id_material WHERE DATE(p.data_hora) BETWEEN ? AND ? GROUP BY dia, m.material ORDER BY dia`, [startDate, endDate]);
        const [prodTam] = await connection.execute(`SELECT DATE_FORMAT(p.data_hora, '%d/%m') as dia, t.tamanho, COUNT(*) as quantidade FROM tb_prod p JOIN tb_tamanho t ON p.tamanho = t.id_tamanho WHERE DATE(p.data_hora) BETWEEN ? AND ? GROUP BY dia, t.tamanho ORDER BY dia`, [startDate, endDate]);
        const [summary] = await connection.execute(`SELECT COUNT(*) as total FROM tb_prod p WHERE DATE(p.data_hora) BETWEEN ? AND ?`, [startDate, endDate]);
        const producaoPorMaterialNormalizada = prodMat.map(item => ({...item, material: normalize(item.material)}));
        const producaoPorTamanhoNormalizada = prodTam.map(item => ({...item, tamanho: normalize(item.tamanho)}));
        res.json({ totalPeriodo: summary[0]?.total || 0, producaoPorMaterial: producaoPorMaterialNormalizada, producaoPorTamanho: producaoPorTamanhoNormalizada, });
    } catch (error) {
        console.error('Erro no endpoint filtered-report:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.post('/api/latest-activities', async (req, res) => {
    let connection;
    try {
        const { limit = 10, ...dbConfig } = req.body;
        connection = await createDynamicConnection(dbConfig);
        if (!connection) throw new Error('Falha na conexão com o banco.');
        const [activities] = await connection.execute(`SELECT p.id_prod as id, p.data_hora as timestamp, c.cor, m.material, t.tamanho FROM tb_prod p JOIN tb_cor c ON p.cor = c.id_cor JOIN tb_material m ON p.material = m.id_material JOIN tb_tamanho t ON p.tamanho = t.id_tamanho ORDER BY p.data_hora DESC LIMIT ?`, [limit]);
        const responseData = activities.map(act => ({ id: act.id, timestamp: act.timestamp, material: normalize(act.material), tamanho: normalize(act.tamanho), cor: act.cor }));
        res.json(responseData);
    } catch (error) {
        console.error('Erro no endpoint latest-activities:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));