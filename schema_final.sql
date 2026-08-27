-- =============================================
-- RESET DATABASE
-- =============================================
DROP DATABASE IF EXISTS gym_cluster_final;
CREATE DATABASE gym_cluster_final;
USE gym_cluster_final;

SET GLOBAL log_bin_trust_function_creators = 1;

-- =============================================
-- DDL: CREATE TABLES
-- =============================================

-- LOGIN
CREATE TABLE login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uname VARCHAR(50) UNIQUE NOT NULL,
    pwd VARCHAR(255) NOT NULL
);

-- GYM
CREATE TABLE gym (
    gym_id VARCHAR(10) PRIMARY KEY,
    gym_name VARCHAR(100) NOT NULL,
    street_no VARCHAR(20),
    street_name VARCHAR(100),
    pin_code VARCHAR(10),
    landmark VARCHAR(100)
);

CREATE TABLE gym_type (
    gym_id VARCHAR(10),
    type ENUM('Men','Women','Unisex'),
    PRIMARY KEY (gym_id, type),
    FOREIGN KEY (gym_id) REFERENCES gym(gym_id) ON DELETE CASCADE
);

-- PAYMENT
CREATE TABLE payment (
    pay_id VARCHAR(10) PRIMARY KEY,
    amount DECIMAL(10,2),
    gym_id VARCHAR(10),
    FOREIGN KEY (gym_id) REFERENCES gym(gym_id) ON DELETE SET NULL
);

-- TRAINER
CREATE TABLE trainer (
    trainer_id VARCHAR(10) PRIMARY KEY,
    pay_id VARCHAR(10),
    trainer_first_name VARCHAR(50),
    trainer_last_name VARCHAR(50),
    FOREIGN KEY (pay_id) REFERENCES payment(pay_id) ON DELETE SET NULL
);

CREATE TABLE trainer_mobile_no (
    mobile_no VARCHAR(15),
    trainer_id VARCHAR(10),
    PRIMARY KEY (mobile_no, trainer_id),
    FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id) ON DELETE CASCADE
);

CREATE TABLE trainer_time (
    trainer_id VARCHAR(10),
    time VARCHAR(50),
    PRIMARY KEY (trainer_id, time),
    FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id) ON DELETE CASCADE
);

-- MEMBER
CREATE TABLE member (
    mem_id VARCHAR(10) PRIMARY KEY,
    dob DATE,
    age INT,
    pay_id VARCHAR(10),
    trainer_id VARCHAR(10),
    mem_first_name VARCHAR(50),
    mem_last_name VARCHAR(50),
    FOREIGN KEY (pay_id) REFERENCES payment(pay_id) ON DELETE SET NULL,
    FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id) ON DELETE SET NULL
);

CREATE TABLE mem_mobile_no (
    mobile_no VARCHAR(15),
    mem_id VARCHAR(10),
    PRIMARY KEY (mobile_no, mem_id),
    FOREIGN KEY (mem_id) REFERENCES member(mem_id) ON DELETE CASCADE
);

-- WORKOUT
CREATE TABLE workout (
    workout_id VARCHAR(10) PRIMARY KEY,
    workout_name VARCHAR(100),
    description TEXT
);

CREATE TABLE workout_plan (
    workout_id VARCHAR(10),
    workout_schedule VARCHAR(100),
    workout_repetition DECIMAL(5,2),
    PRIMARY KEY (workout_id),
    FOREIGN KEY (workout_id) REFERENCES workout(workout_id) ON DELETE CASCADE
);

-- RELATIONSHIP TABLES
CREATE TABLE enrolls_to (
    mem_id VARCHAR(10),
    workout_id VARCHAR(10),
    date DATE,
    PRIMARY KEY (mem_id, workout_id),
    FOREIGN KEY (mem_id) REFERENCES member(mem_id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workout(workout_id) ON DELETE CASCADE
);

CREATE TABLE instructs (
    trainer_id VARCHAR(10),
    workout_id VARCHAR(10),
    PRIMARY KEY (trainer_id, workout_id),
    FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workout(workout_id) ON DELETE CASCADE
);

-- NORMALIZATION RESULT TABLES
CREATE TABLE birth_age (
    dob DATE PRIMARY KEY,
    age INT
);

CREATE TABLE trainer_payment (
    trainer_id VARCHAR(10),
    pay_id VARCHAR(10),
    PRIMARY KEY (trainer_id, pay_id)
);

CREATE TABLE gym_pay (
    gym_id VARCHAR(10),
    pay_id VARCHAR(10),
    PRIMARY KEY (gym_id, pay_id)
);

-- =============================================
-- ALTER TABLE EXAMPLES (DDL)
-- =============================================
ALTER TABLE member ADD COLUMN email VARCHAR(100);
ALTER TABLE member DROP COLUMN email;

-- =============================================
-- TRIGGERS
-- =============================================
DELIMITER $$

-- Trigger 1: Auto calculate age on member insert
CREATE TRIGGER before_member_insert_age
BEFORE INSERT ON member
FOR EACH ROW
BEGIN
    SET NEW.age = TIMESTAMPDIFF(YEAR, NEW.dob, CURDATE());
END$$

-- Trigger 2: Auto delete from instructs when trainer deleted
CREATE TRIGGER delete_from_instructs
BEFORE DELETE ON trainer
FOR EACH ROW
BEGIN
    DELETE FROM instructs WHERE trainer_id = OLD.trainer_id;
END$$

-- Trigger 3: Auto delete trainer mobile number when trainer deleted
CREATE TRIGGER delete_from_t_mobno
BEFORE DELETE ON trainer
FOR EACH ROW
BEGIN
    DELETE FROM trainer_mobile_no WHERE trainer_id = OLD.trainer_id;
END$$

-- Trigger 4: Auto delete member mobile number when member deleted
CREATE TRIGGER delete_from_m_mobno
BEFORE DELETE ON member
FOR EACH ROW
BEGIN
    DELETE FROM mem_mobile_no WHERE mem_id = OLD.mem_id;
END$$

-- Trigger 5: Set trainer_id to NULL in member when trainer deleted
CREATE TRIGGER set_null_trainer
BEFORE DELETE ON trainer
FOR EACH ROW
BEGIN
    UPDATE member SET trainer_id = NULL WHERE trainer_id = OLD.trainer_id;
END$$

-- Trigger 6: Auto delete from instructs when workout deleted
CREATE TRIGGER delete_instruct_w
BEFORE DELETE ON workout
FOR EACH ROW
BEGIN
    DELETE FROM instructs WHERE workout_id = OLD.workout_id;
END$$

-- Trigger 7: Auto delete workout plan when workout deleted
CREATE TRIGGER delete_from_workout_plan
BEFORE DELETE ON workout
FOR EACH ROW
BEGIN
    DELETE FROM workout_plan WHERE workout_id = OLD.workout_id;
END$$

-- Trigger 8: Delete associated trainer and member when payment deleted
CREATE TRIGGER delete_payment
BEFORE DELETE ON payment
FOR EACH ROW
BEGIN
    DELETE FROM trainer WHERE pay_id = OLD.pay_id;
    DELETE FROM member WHERE pay_id = OLD.pay_id;
END$$

-- Trigger 9: Set gym_id NULL in payment and delete gym_type when gym deleted
CREATE TRIGGER delete_gym
BEFORE DELETE ON gym
FOR EACH ROW
BEGIN
    UPDATE payment SET gym_id = NULL WHERE gym_id = OLD.gym_id;
    DELETE FROM gym_type WHERE gym_id = OLD.gym_id;
END$$

DELIMITER ;

-- =============================================
-- FUNCTIONS
-- =============================================
DELIMITER $$

-- Function 1: Calculate age from date of birth
CREATE FUNCTION calculate_age(p_dob DATE)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END$$

-- Function 2: Get total workouts enrolled by a member
CREATE FUNCTION get_member_workouts(p_mem_id VARCHAR(10))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count
    FROM enrolls_to
    WHERE mem_id = p_mem_id;
    RETURN v_count;
END$$

-- Function 3: Get total workouts instructed by a trainer
CREATE FUNCTION get_trainer_workouts(p_trainer_id VARCHAR(10))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count
    FROM instructs
    WHERE trainer_id = p_trainer_id;
    RETURN v_count;
END$$

DELIMITER ;

-- =============================================
-- PROCEDURES
-- =============================================
DELIMITER $$

-- Procedure 1: Assign trainer to a workout
CREATE PROCEDURE add_instructs(IN t_id VARCHAR(10), IN w_id VARCHAR(10))
BEGIN
    INSERT INTO instructs VALUES(t_id, w_id);
END$$

-- Procedure 2: Add a new member
CREATE PROCEDURE add_member(
    IN m_id VARCHAR(10),
    IN m_dob DATE,
    IN m_pay_id VARCHAR(10),
    IN m_trainer_id VARCHAR(10),
    IN m_first VARCHAR(50),
    IN m_last VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Could not add member. Transaction rolled back.' AS message;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM payment WHERE pay_id = m_pay_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Payment ID does not exist';
    END IF;

    INSERT INTO member(mem_id, dob, pay_id, trainer_id, mem_first_name, mem_last_name)
    VALUES(m_id, m_dob, m_pay_id, m_trainer_id, m_first, m_last);

    COMMIT;
    SELECT 'Member added successfully' AS message;
END$$

-- Procedure 3: Update trainer time slot
CREATE PROCEDURE update_trainer_time(IN t_id VARCHAR(10), IN tt VARCHAR(50))
BEGIN
    INSERT INTO trainer_time VALUES(t_id, tt);
END$$

-- Procedure 4: Update member mobile number
CREATE PROCEDURE update_member_mobile_number(
    IN p_mobile_old VARCHAR(15),
    IN p_mobile_new VARCHAR(15),
    IN p_mem_id VARCHAR(10)
)
BEGIN
    UPDATE mem_mobile_no
    SET mobile_no = p_mobile_new
    WHERE mem_id = p_mem_id AND mobile_no = p_mobile_old;
END$$

-- Procedure 5: Show all gym names using cursor
CREATE PROCEDURE show_gyms()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE gname VARCHAR(100);
    DECLARE cur CURSOR FOR SELECT gym_name FROM gym;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO gname;
        IF done THEN LEAVE read_loop; END IF;
        SELECT gname AS gym_name;
    END LOOP;
    CLOSE cur;
END$$

DELIMITER ;

-- =============================================
-- VIEW
-- =============================================
CREATE VIEW member_trainer_view AS
SELECT m.mem_id, m.mem_first_name, m.mem_last_name,
       t.trainer_first_name, t.trainer_last_name
FROM member m
LEFT JOIN trainer t ON m.trainer_id = t.trainer_id;

-- =============================================
-- DML: INSERT DATA
-- =============================================
INSERT INTO gym VALUES
('G1','Gold Gym','86A','Vikas Enclave','180002','Nirmal Traders'),
('G4','Fitness Gym','96B','Patel Nagar','180002',NULL),
('G5','Rhino Gym','78C','Subash Chowk','180001','Marble Station');

INSERT INTO gym_type VALUES
('G1','Men'),
('G4','Men'),
('G4','Women'),
('G5','Women');

INSERT INTO payment VALUES
('P1',5000,'G1'),
('P4',4700,'G4'),
('P5',10000,'G5');

INSERT INTO trainer VALUES
('T1','P1','Ramesh','Gupta'),
('T4','P4','Ram','Singh'),
('T5','P5','Sham','Shah');

INSERT INTO trainer_mobile_no VALUES
('9419192870','T1'),
('9419342809','T1'),
('9908728700','T4'),
('8710908976','T5'),
('9419234578','T5');

INSERT INTO member(mem_id, dob, pay_id, trainer_id, mem_first_name, mem_last_name) VALUES
('M1','2001-01-09','P4','T4','Akshay','Gupta'),
('M2','2005-01-18','P5','T5','Arjun','Sharma'),
('M3','2004-03-23','P4','T4','Amit','Shastri'),
('M4','1999-05-26','P1','T1','Ravi','Kumar');

INSERT INTO mem_mobile_no VALUES
('9086222009','M1'),
('9086222890','M1'),
('9086222100','M2'),
('9086123456','M3'),
('9086123489','M4'),
('9086123423','M4');

INSERT INTO workout VALUES
('W1','Jump Squat','Lower into a deep squat with thighs parallel to floor'),
('W2','Burpee','Chest to floor burpee full body exercise'),
('W3','Tabata','High intensity interval training - 8 rounds'),
('W4','Push-ups','Basic push-ups for chest and arms');

INSERT INTO workout_plan VALUES
('W1','3 sets of 10',2),
('W2','5 sets of 2',1.5),
('W3','8 rounds',1),
('W4','2 sets of 30',0.5);

INSERT INTO enrolls_to VALUES
('M1','W1','2024-01-01'),
('M2','W2','2024-01-05'),
('M3','W3','2024-01-10');

INSERT INTO instructs VALUES
('T1','W1'),
('T4','W2'),
('T5','W3'),
('T1','W4');

INSERT INTO birth_age VALUES
('2001-01-09',23),
('2005-01-18',19),
('2004-03-23',20),
('1999-05-26',25);

INSERT INTO trainer_payment VALUES
('T1','P1'),
('T4','P4'),
('T5','P5');

INSERT INTO gym_pay VALUES
('G1','P1'),
('G4','P4'),
('G5','P5');

INSERT INTO trainer_time VALUES
('T1','6AM-10AM'),
('T1','6PM-8PM'),
('T4','5AM-10AM'),
('T5','7AM-10AM'),
('T5','5PM-7PM');

-- =============================================
-- DML: UPDATE & DELETE EXAMPLES
-- =============================================
UPDATE member SET trainer_id = 'T1' WHERE mem_id = 'M2';
UPDATE payment SET amount = 5500 WHERE pay_id = 'P4';

DELETE FROM enrolls_to WHERE mem_id = 'M2' AND workout_id = 'W2';

-- =============================================
-- SQL QUERIES
-- =============================================

-- Q1: Members with trainer info (JOIN)
SELECT m.mem_id, m.mem_first_name, m.mem_last_name,
       m.trainer_id, t.trainer_first_name, t.trainer_last_name
FROM member m
LEFT JOIN trainer t ON m.trainer_id = t.trainer_id;

-- Q2: Gym total payments (GROUP BY + Aggregate)
SELECT g.gym_id, g.gym_name, SUM(p.amount) AS total_paid
FROM gym g
LEFT JOIN payment p ON g.gym_id = p.gym_id
GROUP BY g.gym_id, g.gym_name;

-- Q3: Members with mobile numbers
SELECT m.mem_id, m.mem_first_name, m.mem_last_name, mm.mobile_no
FROM member m
LEFT JOIN mem_mobile_no mm ON m.mem_id = mm.mem_id;

-- Q4: Trainers with workouts they instruct
SELECT t.trainer_id, t.trainer_first_name, t.trainer_last_name, w.workout_name
FROM trainer t
LEFT JOIN instructs i ON t.trainer_id = i.trainer_id
LEFT JOIN workout w ON i.workout_id = w.workout_id;

-- Q5: Workout plan for all members
SELECT m.mem_id, m.mem_first_name, m.mem_last_name,
       w.workout_name, wp.workout_schedule
FROM member m
LEFT JOIN enrolls_to e ON m.mem_id = e.mem_id
LEFT JOIN workout_plan wp ON e.workout_id = wp.workout_id
LEFT JOIN workout w ON wp.workout_id = w.workout_id;

-- Q6: Gym type with number of trainers
SELECT g.gym_id, g.gym_name,
       GROUP_CONCAT(DISTINCT gt.type SEPARATOR ', ') AS gym_types,
       COUNT(DISTINCT t.trainer_id) AS trainer_count
FROM gym g
LEFT JOIN gym_type gt ON g.gym_id = gt.gym_id
LEFT JOIN payment p ON g.gym_id = p.gym_id
LEFT JOIN trainer t ON p.pay_id = t.pay_id
GROUP BY g.gym_id, g.gym_name;

-- Q7: Members not enrolled in any workout
SELECT m.mem_id, m.mem_first_name, m.mem_last_name
FROM member m
LEFT JOIN enrolls_to e ON m.mem_id = e.mem_id
WHERE e.date IS NULL;

-- Q8: Trainer timeslots
SELECT t.trainer_id, t.trainer_first_name, t.trainer_last_name,
       GROUP_CONCAT(tt.time SEPARATOR ' | ') AS timeslots
FROM trainer t
LEFT JOIN trainer_time tt ON t.trainer_id = tt.trainer_id
GROUP BY t.trainer_id, t.trainer_first_name, t.trainer_last_name;

-- Q9: Subquery - Members whose trainer handles more than 1 workout
SELECT mem_first_name, mem_last_name
FROM member
WHERE trainer_id IN (
    SELECT trainer_id FROM instructs
    GROUP BY trainer_id
    HAVING COUNT(workout_id) > 1
);

-- Q10: HAVING - Gyms with total payment above 5000
SELECT g.gym_id, g.gym_name, SUM(p.amount) AS total
FROM gym g
LEFT JOIN payment p ON g.gym_id = p.gym_id
GROUP BY g.gym_id, g.gym_name
HAVING SUM(p.amount) > 5000;

-- Q11: Using the view
SELECT * FROM member_trainer_view;

-- Q12: Using calculate_age function
SELECT mem_id, mem_first_name, mem_last_name,
       dob, calculate_age(dob) AS current_age
FROM member;

-- Q13: Using get_member_workouts function
SELECT mem_id, mem_first_name,
       get_member_workouts(mem_id) AS total_workouts
FROM member;

-- Q14: Using get_trainer_workouts function
SELECT trainer_id, trainer_first_name,
       get_trainer_workouts(trainer_id) AS total_workouts_instructed
FROM trainer;

-- =============================================
-- TRANSACTION MANAGEMENT
-- =============================================

-- Successful transaction
START TRANSACTION;
INSERT INTO payment VALUES ('P6', 6000, 'G1');
INSERT INTO mem_mobile_no VALUES ('9876543210', 'M1');
COMMIT;

-- Rollback example
START TRANSACTION;
INSERT INTO payment VALUES ('P7', 5500, 'G4');
ROLLBACK;

-- Savepoint example
START TRANSACTION;
INSERT INTO gym VALUES ('G6','Power Gym','10A','MG Road','160001',NULL);
SAVEPOINT gym_added;
INSERT INTO gym_type VALUES ('G6','Men');
ROLLBACK TO gym_added;
COMMIT;

-- =============================================
-- CALLING PROCEDURES
-- =============================================
CALL add_instructs('T4', 'W3');
CALL add_member('M5', '2000-06-15', 'P1', 'T1', 'Neha', 'Verma');
CALL update_trainer_time('T4', '8PM-10PM');
CALL update_member_mobile_number('9086222100', '9999999999', 'M2');
CALL show_gyms();