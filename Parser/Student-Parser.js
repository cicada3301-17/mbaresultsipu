var Sem, Name, Batch, Examination, final = [], len = 0;	// Globals for same set of students.

module.exports = function (data, db, cb) {
	var regexForStudents = /\n\d{11}([^]*?)\n\w\w?\*?(\(..?\))?\r\n\w\w?\r/g;
	require('fs').writeFileSync('data.json', JSON.stringify(data, null, 2));
	process.exit();
	data.forEach((students) => {
		var studentList = students.match(regexForStudents);
		if (studentList) {
			studentList = studentList.map((ele) => (ele.split('\r\n')));
			Sem = students.match(/Sem\.\/Year: (\d+)/)[1];
			Name = students.match(/Programme Name: ([^]*?) Sem/)[1];
			if (students.match(/Batch: ([^]*?) Exa/)) {
				Batch = students.match(/Batch: ([^]*?) Exa/)[1];
				if (parseInt(Batch) < 2013) {
					return;
				}				
			} else {
				return;
			}
			Examination = students.match(/Examination: ([^]*?)\r\n/)[1];
			studentList.forEach((student) => {
				var obj = studentBlueprint();
				obj.EnrollmentNumber = student.shift().substr(1);
				obj.Name = student.shift();
				obj.CreditsSecured = student.pop().match(/(\w+)/);
				try {
					obj.CreditsSecured = obj.CreditsSecured[1];
				} catch (e) {
					obj.CreditsSecured = '';
				}
				// Get rid of unwanted data.
				student.shift(); student.shift();
				var present = false;
				while (student.length) {
					var marks = marksBlueprint();
					var id = student.shift();
					marks.Id = id.match(/\w+/)[0];
					try {
						marks.Credits = id.match(/\((\w+)\)/)[1];
					} catch (e) {  }
					marksValue = student.shift().split(' ');
					marks.Internal = marksValue[0];
					marks.External = marksValue[1];
					var total = student.shift();
					if (!total) continue;
					marks.Total = parseInt(total.match(/\w+/)[0]);
					if (isNaN(marks.Total)) {
						marks.Total = 0;
					} else {
						present = true;
					}
					if (total.match(/\((.+)\)/)) {
						marks.Grade = total.match(/\((.+)\)/)[1];
					}
					obj.Marks.push(marks);
				}
				if (!present) {
					return;
				}
				db.collection('Student').insert(obj, function (err) {
					if (err) {
						console.error(err);
					}
				});
				final[len++] = obj;
			});
		}	
	});
	cb(final);
}

var studentBlueprint = function () {
	return {
		'Semester': Sem,
		'Programme': Name,
		'Batch': Batch,
		'Examination': Examination,
		'EnrollmentNumber': null,
		'Name': null,
		'Marks': [],
		'CreditsSecured': null
	}
}

var marksBlueprint = function () {
	return {
		'Id': null,
		'Credits': null,
		'Internal': null,
		'External': null,
		'Total': null,
		'Grade': null
	}
}