function createPdfWithNews() {

  
  
  const nationalNewsLabel = "ForeignNews"; 
  const query2 = `label:${nationalNewsLabel}`;
  const apiKey = process.env.NEWS_API_KEY;
  const newsApiUrl = `https://newsdata.io/api/1/news?apikey=${apiKey}&language=en`;

  

  // Create a temporary Google Doc to format the content
  const doc = DocumentApp.create("TempDocForPDF");
  const body = doc.getBody();
  

  

  // --- Create First Page with Custom Header ---
  const header = body.appendParagraph("Daily Briefing");
  header.setHeading(DocumentApp.ParagraphHeading.TITLE);
  header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  header.setFontSize(24);
  header.setBold(true);
  
  const date = body.appendParagraph(new Date().toLocaleDateString("en-US", { 
    weekday: "long", year: "numeric", month: "long", day: "numeric" 
  }));
  date.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  date.setFontSize(16);
  

  body.appendPageBreak(); // Page break after the header

  showCalendar(body)

  body.appendPageBreak();

  


  getGeneralNews(body)

  const header2 = body.appendParagraph("Foreign News");
  header2.setHeading(DocumentApp.ParagraphHeading.TITLE);
  header2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  header2.setFontSize(24);
  header2.setBold(true);
  getForeignNews(body)


  body.appendPageBreak(); 

 

  // --- Add News Stories from Newsdata.io ---
  body.appendPageBreak();

  const newsHeader = body.appendParagraph("Today's News Highlights");
  newsHeader.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  newsHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  newsHeader.setFontSize(20);
  newsHeader.setBold(true);

  try {
    // Fetch news data
    const response = UrlFetchApp.fetch(newsApiUrl);
    const newsData = JSON.parse(response.getContentText());

    
    const articles = newsData.results || [];
    articles.slice(0, 5).forEach((article, index) => {
      const title = article.title || "No Title";
      const description = article.description || "No Description Available";

      
      const articleTitle = body.appendParagraph(`${index + 1}. ${title}`);
      articleTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      articleTitle.setSpacingBefore(10);
      articleTitle.setSpacingAfter(5);

      
      const articleDescription = body.appendParagraph(description);
      articleDescription.setSpacingBefore(0);
      articleDescription.setSpacingAfter(10);
      articleDescription.setLineSpacing(1.0);
    });
  } catch (error) {
    Logger.log("Error fetching news data: " + error.message);
    body.appendParagraph("Unable to fetch news stories at this time.");
  }

  body.appendPageBreak();
  const table = body.appendTable([['', '']]); // Initialize with empty strings

  // Get the first row
  const row = table.getRow(0);

  
  const cell1 = row.getCell(0);
  const cell2 = row.getCell(1);

  
  cell1.setWidth(400); 
  cell2.setWidth(400); 

  
  const leftSideContent = cell1.appendParagraph("Left Side Content");
  leftSideContent.setBold(true);

  cell1.appendParagraph("More information on the left.");
  cell1.appendParagraph("Even more details here.");

  // Add content to the right cell
  const rightSideContent = cell2.appendParagraph("Right Side Content");
  rightSideContent.setBold(true);
  rightSideContent.setAlignment(DocumentApp.HorizontalAlignment.RIGHT); 

  cell2.appendParagraph("Information on the right.");
  cell2.appendParagraph("More details on the right.");

  // Style the table (optional)
  table.setBorderWidth(0); 
  table.setPadding(10); 

  

  //--------------------------------------------------------//
  //Saving the DOC and Formatting PDF//
  doc.saveAndClose();
  const tempFile = DriveApp.getFileById(doc.getId());
  const pdfFile = tempFile.getAs(MimeType.PDF);

  // Save the PDF file in Google Drive
  const pdfFileName = `Daily_Briefing_${new Date().toISOString()}.pdf`;
  const folder = DriveApp.getRootFolder();
  folder.createFile(pdfFile.setName(pdfFileName));

  // Clean up the temporary Google Doc
  tempFile.setTrashed(true);

  Logger.log(`PDF created: ${pdfFileName}`);

body.appendPageBreak();
  getTopGainersStock(body);
  
}


function showCalendar(body){
  // --- Add Calendar Events Section ---
  const calendarHeader = body.appendParagraph("Today's Schedule");
  calendarHeader.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  calendarHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  calendarHeader.setFontSize(20);
  calendarHeader.setBold(true);

  // Get all calendars and their events
  const calendars = CalendarApp.getAllCalendars();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  
  // Collect all events from all calendars
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
    const noEvents = body.appendParagraph("No events scheduled for today.");
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

      // Check if it's an all-day event by comparing start and end times
      const isAllDay = startTime.getHours() === 0 && 
                      startTime.getMinutes() === 0 && 
                      endTime.getHours() === 0 && 
                      endTime.getMinutes() === 0 &&
                      (endTime.getTime() - startTime.getTime()) >= 24 * 60 * 60 * 1000;

      // Format the time string based on whether it's an all-day event
      const timeString = isAllDay 
        ? "All Day Event"
        : `${startTime.toLocaleTimeString('en-US', timeFormat)} - ${endTime.toLocaleTimeString('en-US', timeFormat)}`;

      // Format event information
      const eventText = body.appendParagraph(
        `${index + 1}. ${eventTitle}\n` +
        `Time: ${timeString}\n` +
        (description ? `Description: ${description}` : "")
      );
      
      eventText.setSpacingAfter(10);
      eventText.setFontSize(13);
      
      // Make the event title bold
      const textElement = eventText.editAsText();
      const titleEndIndex = eventTitle.length + 3; // Accounts for the number and period
      textElement.setBold(0, titleEndIndex, true);
      
      // Add a divider between events
      if (index < allEvents.length - 1) {
        const divider = body.appendParagraph("―――――");
        divider.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        divider.setSpacingBefore(5);
        divider.setSpacingAfter(5);
        divider.setFontSize(13);
      }
    });
  }
}



function getGeneralNews(body){
const labelName = "NewsBreifing"; // Gmail label name
const query1 = `label:${labelName}`;

const threads = GmailApp.search(query1, 0, 3);
  if (threads.length === 0) {
    Logger.log(`No emails found with label: ${labelName}`);
    return;
  }

// --- Process Emails ---
  threads.forEach((thread, index) => {
    const messages = thread.getMessages();

    messages.forEach((message, messageIndex) => {
      const subject = message.getSubject();
      const from = message.getFrom();
      const date = message.getDate();
      let plainBody = message.getPlainBody();

      // Remove external links and disclaimers
      plainBody = plainBody.replace(/https?:\/\/\S+/g, "[]");
      plainBody = plainBody.replace(/unsubscribe|privacy notice|contact us|customer service|copyright/i, "");

      // Minimize extra spaces
      plainBody = plainBody.replace(/\n\s*\n/g, "\n");

      // Add a divider for each email
      if (index > 0 || messageIndex > 0) {
        const divider = body.appendParagraph("---------------------------------------------------");
        divider.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        divider.setSpacingBefore(0);
        divider.setSpacingAfter(0);
      }

      // Add the email title as a heading
      const heading = body.appendParagraph(`Email ${index + 1} - ${subject}`);
      heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      heading.setSpacingBefore(0);
      heading.setSpacingAfter(0);

      // Add metadata like sender and date
      const metadata = body.appendParagraph(`From: ${from}\nDate: ${date}`);
      metadata.setSpacingBefore(0);
      metadata.setSpacingAfter(0);
      metadata.setLineSpacing(1.0);

      // Add the message body with minimal spacing
      const emailBody = body.appendParagraph(plainBody);
      emailBody.setSpacingBefore(0);
      emailBody.setSpacingAfter(0);
      emailBody.setLineSpacing(1.0);
    });
  });

}

function getForeignNews(body){
const labelName = "ForeignNews"; // Gmail label name
const query1 = `label:${labelName}`;

const threads = GmailApp.search(query1, 0, 3);
  if (threads.length === 0) {
    Logger.log(`No emails found with label: ${labelName}`);
    return;
  }

// --- Process Emails ---
  threads.forEach((thread, index) => {
    const messages = thread.getMessages();

    messages.forEach((message, messageIndex) => {
      const subject = message.getSubject();
      const from = message.getFrom();
      const date = message.getDate();
      let plainBody = message.getPlainBody();

      // Remove external links and disclaimers
      plainBody = plainBody.replace(/https?:\/\/\S+/g, "[]");
      plainBody = plainBody.replace(/unsubscribe|privacy notice|contact us|customer service|copyright/i, "");

      // Minimize extra spaces
      plainBody = plainBody.replace(/\n\s*\n/g, "\n");

      // Add a divider for each email
      if (index > 0 || messageIndex > 0) {
        const divider = body.appendParagraph("---------------------------------------------------");
        divider.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        divider.setSpacingBefore(0);
        divider.setSpacingAfter(0);
      }

      // Add the email title as a heading
      const heading = body.appendParagraph(`Email ${index + 1} - ${subject}`);
      heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      heading.setSpacingBefore(0);
      heading.setSpacingAfter(0);

      // Add metadata like sender and date
      const metadata = body.appendParagraph(`From: ${from}\nDate: ${date}`);
      metadata.setSpacingBefore(0);
      metadata.setSpacingAfter(0);
      metadata.setLineSpacing(1.0);

      // Add the message body with minimal spacing
      const emailBody = body.appendParagraph(plainBody);
      emailBody.setSpacingBefore(0);
      emailBody.setSpacingAfter(0);
      emailBody.setLineSpacing(1.0);
    });
  });

}


function getTopGainersStock(body) {
  const stockApiKey = process.env.API_KEY;// Add your own API Key
  const stockApiUrl = `https://api.stockapi.io/top-gainers?apikey=${stockApiKey}`; // Replace with actual API URL and API key

  try {
    // Fetch stock data from the API
    const response = UrlFetchApp.fetch(stockApiUrl);
    const stockData = JSON.parse(response.getContentText());

    // Add header for stock gainers
    const header = body.appendParagraph("Top Gainers - Stock Market");
    header.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    header.setFontSize(20);
    header.setBold(true);
    header.setSpacingAfter(10);

    // Check if data is available
    if (!stockData || stockData.length === 0) {
      const noData = body.appendParagraph("No top gainers data available.");
      noData.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      return;
    }

    // Append top gainers to the document
    stockData.slice(0, 5).forEach((stock, index) => {
      const stockInfo = body.appendParagraph(
        `${index + 1}. ${stock.name} (${stock.symbol})\n` +
        `Price: $${stock.price.toFixed(2)}\n` +
        `Change: ${stock.changePercent}%`
      );

      stockInfo.setSpacingAfter(10);
      stockInfo.setFontSize(13);

      // Bold the stock name
      const textElement = stockInfo.editAsText();
      textElement.setBold(0, stock.name.length + 3 + stock.symbol.length, true);
    });
  } catch (error) {
    Logger.log("Error fetching stock data: " + error.message);
    body.appendParagraph("Unable to fetch stock data at this time.");
  }
}








