
function createSundayBriefing() {
    
  const doc = DocumentApp.create("TempDocForPDF");
  const body = doc.getBody();
  
  
  createCoverPage(body)//Cover Page

  showCalendar(body)// Show Calendar

  showImportantCalendar(body)
  const apiKey = process.env.NEWS_API_KEY;
const apiUrl = `https://financialmodelingprep.com/api/v3/sectors-performance?apikey=${apiKey}`;

const response = UrlFetchApp.fetch(apiUrl);
const earningsData = JSON.parse(response.getContentText());

if (!earningsData || earningsData.length === 0) {
  Logger.log("No earnings data available.");
  return;
}


body.appendParagraph("Economic Sectors");
// header.setHeading(DocumentApp.ParagraphHeading.TITLE);
// header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
// header.setFontSize(34);
// header.setBold(true);

// Loop through the earnings data and add it to the document
earningsData.forEach(function(earning) {
  const sector = earning.sector;
  const changesPercentage	 = earning.changesPercentage	;
  
  const paragraph = body.appendParagraph(`${sector} - ${changesPercentage}`);
  paragraph.setFontSize(14);
  paragraph.setLineSpacing(1.5);
  paragraph.setBold(true);
  

  body.appendParagraph("");

});

// Save the document
doc.saveAndClose();
const tempFile = DriveApp.getFileById(doc.getId());
  const pdfFile = tempFile.getAs(MimeType.PDF);

  // Save the PDF file in Google Drive
  const pdfFileName = `Sunday_Briefing_${new Date().toISOString()}.pdf`;
  const folder = DriveApp.getRootFolder();
  folder.createFile(pdfFile.setName(pdfFileName));

  // Clean up the temporary Google Doc
  tempFile.setTrashed(true);

  Logger.log(`PDF created: ${pdfFileName}`);

// Log the document URL for access
Logger.log("Sectors call schedule document created: " + doc.getUrl());
}




function createCoverPage(body) {
  //      Cover Page Logic
  const header = body.appendParagraph("Sunday Briefing");
  header.setHeading(DocumentApp.ParagraphHeading.TITLE);
  header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  header.setFontSize(34);
  header.setBold(true);

  const date = body.appendParagraph(new Date().toLocaleDateString("en-US", { 
    weekday: "long", year: "numeric", month: "long", day: "numeric" 
  }));
  date.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  date.setFontSize(16);

  const intro = body.appendParagraph(
    "This is your Sunday Briefing that will provide you with information occurring in the upcoming week."
  );
  intro.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  body.appendPageBreak(); // Move to the next page
}

function showCalendar(body){
   ////////////////////////////////////////////////////
  //      Calendar Page  

  const calendarHeader = body.appendParagraph("Today's Schedule");
  calendarHeader.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  calendarHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  calendarHeader.setFontSize(20);
  calendarHeader.setBold(true);

  const calendars = CalendarApp.getAllCalendars();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);

  let allEvents = [];
  calendars.forEach(calendar => {
    const calendarEvents = calendar.getEvents(today, tomorrow);
    calendarEvents.forEach(event => {
      allEvents.push({
        event: event
      });
    });
  });

  if (allEvents.length === 0) {
    const noEvents = body.appendParagraph("You have no Schedules Events for Today.");
    noEvents.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    noEvents.setItalic(true);
    noEvents.setFontSize(13);
  } else {
    allEvents.sort((a, b) => a.event.getStartTime().getTime() - b.event.getStartTime().getTime());

    allEvents.forEach((eventData, index) => {
      const event = eventData.event;
      const startTime = event.getStartTime();
      const endTime = event.getEndTime();
      const timeFormat = { hour: 'numeric', minute: '2-digit', hour12: true };

      const eventTitle = event.getTitle();
      const description = event.getDescription() || "";

      const isAllDay = startTime.getHours() === 0 && 
                      startTime.getMinutes() === 0 && 
                      endTime.getHours() === 0 && 
                      endTime.getMinutes() === 0 &&
                      (endTime.getTime() - startTime.getTime()) >= 24 * 60 * 60 * 1000;

      const timeString = isAllDay 
        ? "All Day Event"
        : `${startTime.toLocaleTimeString('en-US', timeFormat)} - ${endTime.toLocaleTimeString('en-US', timeFormat)}`;

      const eventText = body.appendParagraph(
        `${index + 1}. ${eventTitle}\n` +
        `Time: ${timeString}\n` +
        (description ? `Description: ${description}` : "")
      );

      eventText.setSpacingAfter(10);
      eventText.setFontSize(13);

      const textElement = eventText.editAsText();
      const titleEndIndex = eventTitle.length + 3;
      textElement.setBold(0, titleEndIndex, true);

      if (index < allEvents.length - 1) {
        const divider = body.appendParagraph("-------------------------------------------");
        divider.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        divider.setSpacingBefore(5);
        divider.setSpacingAfter(5);
        divider.setFontSize(13);
      }
    });
  }
  body.appendPageBreak(); 

}

function showImportantCalendar(body){
  // Your Important Events for this Week
  const importantCalendarHeader = body.appendParagraph("IMPORTANT EVENTS for this Week");
  importantCalendarHeader.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  importantCalendarHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  importantCalendarHeader.setFontSize(20);
  importantCalendarHeader.setBold(true);
  
  const importantCalendarName = "IMPORTANT";
  const importantCalendar = CalendarApp.getCalendarsByName(importantCalendarName)[0];

  if (!importantCalendar) {
    const importantCalendarError = body.appendParagraph(`No calendar named "${importantCalendarName}" found.`);
    importantCalendarError.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    importantCalendarError.setFontSize(14);
    importantCalendarError.setItalic(true);
    return;
  }

  const today1 = new Date();
  const weekStartDate = new Date(today1);
  weekStartDate.setDate(today1.getDate() - today1.getDay());
  weekStartDate.setHours(0, 0, 0, 0);

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  const importantEvents = importantCalendar.getEvents(weekStartDate, weekEndDate);

  if (importantEvents.length === 0) {
    const noImportantEvents = body.appendParagraph(`No scheduled events for the week (${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}).`);
    noImportantEvents.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    noImportantEvents.setFontSize(13);
    noImportantEvents.setItalic(true);
  } else {
    importantEvents.sort((a, b) => a.getStartTime().getTime() - b.getStartTime().getTime());

    let currentEventDate = null;

    importantEvents.forEach((event, index) => {
      const eventDate = event.getStartTime().toDateString();

      if (eventDate !== currentEventDate) {
        currentEventDate = eventDate;

        const dayHeader = body.appendParagraph(currentEventDate);
        dayHeader.setHeading(DocumentApp.ParagraphHeading.HEADING2);
        dayHeader.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
        dayHeader.setSpacingBefore(10);
        dayHeader.setSpacingAfter(5);
        dayHeader.setFontSize(16);
        dayHeader.setBold(true);
      }

      const eventStartTime = event.getStartTime();
      const eventEndTime = event.getEndTime();
      const timeFormat = { hour: 'numeric', minute: '2-digit', hour12: true };

      const eventTitle = event.getTitle();
      const eventDescription = event.getDescription() || "No description provided.";

      const isAllDay = eventStartTime.getHours() === 0 &&
                      eventStartTime.getMinutes() === 0 &&
                      eventEndTime.getHours() === 0 &&
                      eventEndTime.getMinutes() === 0 &&
                      (eventEndTime.getTime() - eventStartTime.getTime()) >= 24 * 60 * 60 * 1000;

      const timeString = isAllDay
        ? "All Day Event"
        : `${eventStartTime.toLocaleTimeString('en-US', timeFormat)} - ${eventEndTime.toLocaleTimeString('en-US', timeFormat)}`;

      const eventParagraph = body.appendParagraph(
        `${index + 1}. ${eventTitle}\n` +
        `Time: ${timeString}`
      );

      eventParagraph.setSpacingAfter(5);
      eventParagraph.setFontSize(13);
      eventParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);

      const descriptionParagraph = body.appendParagraph(`Description: ${eventDescription}`);
      descriptionParagraph.setSpacingAfter(10);
      descriptionParagraph.setFontSize(11);
      descriptionParagraph.setItalic(true);
      descriptionParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);

      const textElement = eventParagraph.editAsText();
      const titleEndIndex = eventTitle.length + 3;
      textElement.setBold(0, titleEndIndex, true);

      if (index < importantEvents.length - 1) {
        const divider = body.appendParagraph("-------------------------------------------");
        divider.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        divider.setSpacingBefore(5);
        divider.setSpacingAfter(5);
        divider.setFontSize(13);
      }
      importantCalendarHeader.appendPageBreak()
    });
  }
}


