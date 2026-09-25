import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import json

def generate_incident_pdf(inc, op, activities, guard, pdf_path):
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name='TitleStyle',
        parent=styles['Heading1'],
        alignment=1, # Center
        fontSize=18,
        spaceAfter=20
    )
    h2_style = ParagraphStyle(
        name='H2Style',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#064e3b'), # emerald-900
        spaceBefore=15,
        spaceAfter=10
    )
    normal_style = styles['Normal']
    
    story = []
    
    # Header
    story.append(Paragraph("<b>GAIA</b>", title_style))
    story.append(Paragraph("AI-Powered Wildlife Monitoring & Human-Wildlife Conflict Management System", ParagraphStyle(name='Sub', alignment=1, fontSize=10, spaceAfter=20)))
    story.append(Paragraph("AUTOMATED INCIDENT FINAL REPORT", title_style))
    
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Incident Information
    story.append(Paragraph("INCIDENT INFORMATION", h2_style))
    
    reporter_name = inc.reported_by_user.full_name if hasattr(inc, 'reported_by_user') and inc.reported_by_user else 'Not Available' if (inc and getattr(inc, 'reporter', None)) else "Not Available"
    reporter_type = inc.reported_by_user.role if hasattr(inc, 'reported_by_user') and inc.reported_by_user else 'Not Available' if (inc and getattr(inc, 'reporter', None)) else "Not Available"
    
    inc_data = [
        ["Incident Number:", inc.reference_id if inc else "Not Available"],
        ["Incident Type:", inc.incident_category if inc else "Not Available"],
        ["Animal / Species:", inc.animal_type if inc else (inc.animal if inc else "Not Available")],
        ["Incident Date:", f"{inc.date_reported} {inc.time_reported}" if inc else "Not Available"],
        ["Date Reported:", inc.created_at.strftime("%Y-%m-%d %H:%M:%S") if inc and getattr(inc, 'created_at', None) else "Not Available"],
        ["Current Status:", inc.status if inc else "Not Available"],
        ["Priority / Severity:", inc.severity if inc else "Not Available"],
        ["Reporter Name:", reporter_name],
        ["Reporter Type:", reporter_type],
    ]
    t = Table(inc_data, colWidths=[2*inch, 4.5*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))
    
    # Location
    story.append(Paragraph("INCIDENT LOCATION", h2_style))
    loc_data = [
        ["Location:", inc.location if inc else "Not Available"],
        ["Village:", inc.village.village_name if inc.village else 'Not Available' if inc else "Not Available"],
        ["Assigned Station:", inc.station_rel.station_name if hasattr(inc, 'station_rel') and inc.station_rel else 'Not Available' if inc else "Not Available"],
    ]
    t_loc = Table(loc_data, colWidths=[2*inch, 4.5*inch])
    t_loc.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_loc)
    story.append(Spacer(1, 10))
    
    # Description
    story.append(Paragraph("INCIDENT DESCRIPTION", h2_style))
    story.append(Paragraph(inc.description if inc else "Not Available", normal_style))
    story.append(Spacer(1, 10))
    
    # Forest Guard Assignment & Acceptance
    story.append(Paragraph("FOREST GUARD ASSIGNMENT & ACCEPTANCE", h2_style))
    if inc and hasattr(inc, 'assigned_officers') and inc.assigned_officers:
        guards_data = [["Guard Name", "Role", "Status"]]
        for assignment in inc.assigned_officers:
            g_name = assignment.officer.full_name if assignment.officer else "Unknown"
            g_role = assignment.officer.role if assignment.officer else "Unknown"
            g_status = assignment.assignment_status
            guards_data.append([g_name, g_role, g_status])
        
        t_guards = Table(guards_data, colWidths=[2.5*inch, 2*inch, 2*inch])
        t_guards.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e5e7eb')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_guards)
    else:
        story.append(Paragraph("No guards assigned.", normal_style))
    story.append(Spacer(1, 10))
    
    # Field Operation Progress Timeline
    story.append(Paragraph("FIELD OPERATION PROGRESS", h2_style))
    if activities:
        timeline_data = [["Time", "Step", "Updater Guard", "Notes"]]
        for act in activities:
            t_time = act.created_at.strftime("%Y-%m-%d %H:%M") if act.created_at else "Unknown"
            t_step = act.action
            t_guard = act.user.full_name if act.user else "Unknown"
            t_notes = act.remarks or ""
            timeline_data.append([t_time, t_step, t_guard, Paragraph(t_notes, normal_style)])
            
        t_timeline = Table(timeline_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 2*inch])
        t_timeline.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e5e7eb')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_timeline)
    else:
        story.append(Paragraph("No timeline events recorded.", normal_style))
    story.append(Spacer(1, 10))
    
    # Field Findings
    story.append(Paragraph("FIELD FINDINGS / OBSERVATIONS", h2_style))
    actions_list = []
    if op and op.actions_checklist:
        try:
            actions_list = json.loads(op.actions_checklist)
        except:
            actions_list = [op.actions_checklist]
            
    findings_data = [
        ["Animal Present:", "Yes" if op and op.animal_present else "No"],
        ["Behaviour:", op.animal_behaviour if op else "Not Available"],
        ["Threat Level:", op.threat_level if op else "Not Available"],
        ["Actions Taken:", ", ".join(actions_list) if actions_list else "None"],
        ["Remarks:", op.action_remarks if op else "None"],
        ["Outcome:", op.outcome if op else "Not Available"],
        ["Direction:", op.animal_direction if op else "Not Available"],
        ["Remaining Risk:", op.remaining_risk if op else "Not Available"],
    ]
    t_findings = Table(findings_data, colWidths=[2*inch, 4.5*inch])
    t_findings.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_findings)
    story.append(Spacer(1, 10))
    
    # Evidence
    story.append(Paragraph("EVIDENCE", h2_style))
    if op and op.evidence_photos:
        try:
            photos = json.loads(op.evidence_photos)
            for i, p in enumerate(photos):
                # Construct absolute path from relative
                # p is like "/static/uploads/evidence/XYZ.jpg"
                abs_path = os.path.join(os.getcwd(), "app", *p.split("/")[1:])
                if os.path.exists(abs_path):
                    story.append(Paragraph(f"Evidence {i+1}", normal_style))
                    # Scale image to fit width ~4 inches
                    img = Image(abs_path)
                    img.drawHeight = 4*inch * img.drawHeight / img.drawWidth
                    img.drawWidth = 4*inch
                    story.append(img)
                    story.append(Spacer(1, 10))
        except Exception as e:
            story.append(Paragraph(f"Could not load evidence photos.", normal_style))
    else:
        story.append(Paragraph("No evidence photos uploaded.", normal_style))
    story.append(Spacer(1, 20))
    
    # Signature
    story.append(Paragraph("FINAL REPORT SUBMISSION", h2_style))
    story.append(Paragraph(f"<b>Submitted By:</b> {guard.full_name}", normal_style))
    story.append(Paragraph(f"<b>Date:</b> {now}", normal_style))
    story.append(Spacer(1, 10))
    
    if op and op.officer_signature:
        abs_sig = os.path.join(os.getcwd(), "app", *op.officer_signature.split("/")[1:])
        if os.path.exists(abs_sig):
            story.append(Paragraph("<b>Digital Signature:</b>", normal_style))
            img = Image(abs_sig)
            img.drawHeight = 2*inch * img.drawHeight / img.drawWidth
            img.drawWidth = 2*inch
            story.append(img)
        else:
            story.append(Paragraph("<b>Digital Signature:</b> Missing image file", normal_style))
    else:
        story.append(Paragraph("<b>Digital Signature:</b> Missing", normal_style))
    
    doc.build(story)
    return True
