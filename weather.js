const express = require('express');
const pgp = require('pg-promise')();

const router = express.Router();

router.use(express.json());

const db = pgp({
    database: 'weather',
    user: "postgres",
    password: "0203"
})


router.get('/states', async (req, res) => {
    res.json(await db.many('SELECT * from states'));
});


router.get('/cities', async (req,res) => {
    res.json(await db.many(`
        SELECT s.name, c.name
        FROM cities c
        INNER JOIN states s ON s.abbrev = c.state_abbrev
      
    `));
});


router.get('/states/:abbrev', async (req,res) => {
    res.json(await db.oneOrNone(`SELECT * FROM states WHERE abbrev = $(abbrev)`, {
        abbrev: req.params.abbrev
}));

    console.log(state);

    if(!state) {
        return res.status(404).send('State could not be found')
    }

    res.json(state)


});


router.get('/city/:id', async (req,res) => {
    res.json(await db.oneOrNone(`
    SELECT c.name, avg(temperature)
    FROM temperatures t
    INNER JOIN cities c ON c.id = t.city_id
    WHERE c.id = $(city_id)
    group by c.id, c.name
    `,
    {
        city_id: +req.params.id
    }

    ))

    if(!city_id) {
        return res.status(404).send('No information on this city')
    }

     res.json(city_id)  // Hmmmm, How to do this?
   
});


router.get('/temperature/:climate', async (req,res) => {
    res.json(await db.oneOrNone(`
    
    `))
})


router.post('/states', async (req,res) => {


    try {
        const existing = await db.oneOrNone('Select abbrev, name FROM states WHERE abbrev = $(abbrev)', { abbrev: req.body.abbrev, name: req.body.name });

        if(existing) {
            return res.status(400).send('The state already exists...')
        }

        await db.none('INSERT INTO states (abbrev, name) VALUES ($(abbrev), $(name))', {
            abbrev: req.body.abbrev,
            name: req.body.name
        });

        const state = await db.one('SELECT abbrev, name FROM states WHERE abbrev = $(abbrev)', { abbrev: req.body.abbrev, name: req.body.name });

        res.status(201).json(state)


} catch (error) {
        console.log(error);
        if(error.constraint === 'states_pkey') {
            return res.status(400).send('The state already exists...')
        }
    }
})


router.post('/cities', async (req,res) => {


    try {
        const ins = await db.oneOrNone('INSERT INTO cities (state_abbrev, name, climate) VALUES ($(state_abbrev), $(name), $(climate)) RETURNING id', { 
            state_abbrev: req.body.state_abbrev, 
            name: req.body.name,
            climate: req.body.climate
        });

        console.log(ins);

        const city = await db.one('SELECT id, state_abbrev, name, climate FROM cities WHERE id = $(id)', { id: ins.id });
        
        return res.status(201).json(city)

        
} catch (error) {
        console.log(error);
        if(error.constraint === 'cities_pkey') {
            return res.status(400).send('The city already exists...')
        }
    }
})

router.post('/temperature', async (req,res) => {

    try {

        const result = await db.oneOrNone('INSERT INTO temperatures (city_id, date, temperature VALUES ($(city_id), $(date), $(temperature)) RETURNING id', {
            city_id: req.body.city_id,
            date: req.body.date,
            temperature: req.body.temperature
        });

        const temperature = await db.one('SELECT id, city_id, date, temperature FROM temperatures WHERE id = $(id)', {
            id: result.id
        });

        return res.status(201).json(temperature)
    } catch (error) {
        if(error.constraint === 'temeratures_city_id_date') {
            return res.status(400).send('The temperature exists for this city and date...')
        }
    }

});


router.delete('/states/:abbrev', async (req,res) => {
    await db.none('DELETE FROM states WHERE abbrev = $(abbrev)' , { abbrev: req.params.abbrev});

    return res.status(204).send()

})

router.delete('/cities/:id', async (req,res) => {
    await db.none('DELETE FROM cities WHERE id = $(id)' , { id: req.params.id });

    return res.status(204).send()

})

router.delete('/temperatures/:id', async (req,res) => {
    await db.none('DELETE FROM temperautres WHERE id = $(id)' , { id: req.params.id });

    return res.status(204).send()

})



router.put('/states/:abbrev', async (req,res) => {


    const ableToUpdate = await db.oneOrNone('Select abbrev, name FROM states WHERE abbrev = $(abbrev)', { abbrev: req.body.abbrev, name: req.body.name });



        if(ableToUpdate) {
            await db.many(`ALTER TABLE states DROP CONSTRAINT temperature_city_id_date`)

            const newState = await db.one(`UPDATE states SET abbrev = $(newAbbrev), name = $(newName) WHERE abbrev = $(abbrev)`, {
                newAbbrev: req.body.abbrev,
                newName: req.body.name
            })
        
        } else {
            return res.status(404).send('The state could not be found...')
        }

    await db.many('ALTER TABLE states ADD CONSTRAINT temperature_city_id_date UNIQUE (city_id, date)')

    return res.status(204).json(newState)


})

router.put('/cities/:id', async (req,res) => {


    const ableToUpdate = await db.oneOrNone('Select abbrev, name FROM states WHERE abbrev = $(abbrev)', { abbrev: req.body.abbrev, name: req.body.name });



        if(ableToUpdate) {
            await db.many(`ALTER TABLE states DROP CONSTRAINT temperature_city_id_date`)

            const newState = await db.one(`UPDATE states SET abbrev = $(newAbbrev), name = $(newName) WHERE abbrev = $(abbrev)`, {
                newAbbrev: req.body.abbrev,
                newName: req.body.name
            })
        
        } else {
            return res.status(404).send('The state could not be found...')
        }

    await db.many('ALTER TABLE states ADD CONSTRAINT temperature_city_id_date UNIQUE (city_id, date)')

    return res.status(204).json(newState)


})


router.put('/temperatures/:id', async (req,res) => {


    const ableToUpdate = await db.oneOrNone('Select abbrev, name FROM states WHERE abbrev = $(abbrev)', { abbrev: req.body.abbrev, name: req.body.name });



        if(ableToUpdate) {
            await db.many(`ALTER TABLE states DROP CONSTRAINT temperature_city_id_date`)

            const newState = await db.one(`UPDATE states SET abbrev = $(newAbbrev), name = $(newName) WHERE abbrev = $(abbrev)`, {
                newAbbrev: req.body.abbrev,
                newName: req.body.name
            })
        
        } else {
            return res.status(404).send('The state could not be found...')
        }

    await db.many('ALTER TABLE states ADD CONSTRAINT temperature_city_id_date UNIQUE (city_id, date)')

    return res.status(204).json(newState)


})





module.exports = router; 