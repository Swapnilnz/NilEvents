const db = require('../../../config/db');

async function checkCategoryExists(category) {

    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT category_id FROM event_category WHERE category_id = ?';
        const result = await conn.query(sql, category);
        conn.release();
        return result.length !== 0;

    } catch (err) {
        console.log(err);
        throw (err);
    }
}

exports.getAllByQueryAndOrganizer = async function (queryString, organizerId) {

    try {
        const conn = await db.getPool().getConnection();
        queryString = '\'%' + queryString + '%\'';

        var sql = 'SELECT id FROM event ' +
            'WHERE (title LIKE ' + queryString + ' OR description LIKE ' + queryString + ')';

        if (organizerId != null) {
            sql += ' AND (organizer_id = ?);';
        }
        const [rows] = await conn.query(sql, organizerId);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.getAllByCategories = async function (categories) {
    if (categories.length === 0) {
        return [];
    }

    try {
        const conn = await db.getPool().getConnection();

        const sql = 'SELECT DISTINCT event_id FROM event_category WHERE category_id IN (' + categories.toString() + ') ';

        const [rows] = await conn.query(sql);
        conn.release();

        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.getEventAndOrganizerById = async function (id) {
  try {
      const conn = await db.getPool().getConnection();
      const sql = 'SELECT e.id, e.title, e.capacity, e.date, u.first_name, u.last_name FROM user u JOIN event e ON u.id = e.organizer_id WHERE e.id = ?';
      const [rows] = await conn.query(sql, id);
      conn.release();
      return rows
  } catch (err) {
      throw (err);
  }
};

exports.getEventCategories = async function (id) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT category_id FROM event_category WHERE event_id = ?';
        const [rows] = await conn.query(sql, id);
        conn.release();
        return rows
    } catch (err) {
        throw (err);
    }
};

exports.getEventNumAttendeesByState = async function (id, state) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT count(*) AS num_attendees FROM event_attendees ' +
            'JOIN attendance_status `as` ON `as`.id = event_attendees.attendance_status_id WHERE event_id = ? AND name = ?;';
        const values = [id, state]
        const [rows] = await conn.query(sql, values);
        conn.release();
        return rows
    } catch (err) {
        throw (err);
    }
};

exports.getOneEventById = async function (id) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT e.id as event_id, title, first_name, last_name, capacity, description, ' +
            'organizer_id, date, is_online, url, venue, requires_attendance_control, fee ' +
            'FROM event e join user u on u.id = e.organizer_id WHERE e.id = ?';
        const [rows] = await conn.query(sql, id);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.getAllCategories = async function () {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT id, name FROM category';
        const [rows] = await conn.query(sql);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.checkCategoryExists = async function (categoryId) {
  try {
      const conn = await db.getPool().getConnection();
      const sql = 'SELECT count(*) as numCatagories FROM category WHERE id = ' + categoryId;
      const [rows] = await conn.query(sql);
      conn.release();
      return rows[0].numCatagories !== 0;
  } catch (err) {
      throw (err);
  }
};

exports.addEventAndCategories = async function (eventId, categoryIds) {
    try {
        categoryIds = (typeof categoryIds === "number") ? [categoryIds]: categoryIds;
        for (let category of categoryIds) {
            const conn = await db.getPool().getConnection();
            const sql = 'INSERT INTO event_category (event_id, category_id) VALUES (?, ?)';
            const values = [eventId, category]
            await conn.query(sql, values);
            conn.release();
        }
    } catch (err) {
        throw (err);
    }
}

exports.addEvent = async function (values) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'INSERT INTO event (title, description, date, is_online, url, venue, capacity, requires_attendance_control, fee, organizer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?); SELECT LAST_INSERT_ID() AS id;'
        const [rows] = await conn.query(sql, values);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }

};

exports.deleteEventCategoriesForEvent = async function (eventId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'DELETE FROM event_category WHERE event_id = ?';
        const [rows] = await conn.query(sql, eventId);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.deleteEventAttendeesForEvent = async function (eventId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'DELETE FROM event_attendees WHERE event_id = ?';
        const [rows] = await conn.query(sql, eventId);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.deleteEvent = async function (eventId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'DELETE FROM event where id = ?;';
        const [rows] = await conn.query(sql, eventId);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.updateColumnById = async function (column, value, eventId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE event SET ' + column + ' = ? WHERE id  = ?';
        const [rows] = await conn.query(sql, [value, eventId]);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};
