import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback
} from 'react';

import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

import {
    fetchExamOptionsApi,
    fetchExamByIdApi,
    saveExamDetailsApi,
    deleteExamApi,
    fetchScheduleTimetableApi,
    saveScheduleTimetableApi,
    fetchMarksEntryStudentsApi,
    saveMarksEntryDraftApi,
    submitMarksEntryApi
} from '../api/examination';

import {
    ExamSetup,
    ExamMark,
    ExamSchedule
} from '../types';


interface ExaminationContextType {
    exams: ExamSetup[];
    examMarks: ExamMark[];
    examSchedules: ExamSchedule[];

    addExam: (
        exam: Omit<ExamSetup, 'id'>
    ) => Promise<void>;

    updateExam: (
        id: string,
        updates: Partial<ExamSetup>
    ) => Promise<void>;

    deleteExam: (
        id: string
    ) => Promise<void>;

    saveMarks: (
        marks: Omit<ExamMark, 'id'>[]
    ) => Promise<void>;

    addExamSchedule: (
        schedule: Omit<ExamSchedule, 'id'>
    ) => Promise<void>;

    updateExamSchedule: (
        id: string,
        updates: Partial<ExamSchedule>
    ) => Promise<void>;

    deleteExamSchedule: (
        id: string
    ) => Promise<void>;

    refreshExamData: () => Promise<void>;
}


const ExaminationContext =
    createContext<ExaminationContextType | undefined>(
        undefined
    );


export const ExaminationProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {

    const { addToast } = useToast();

    /*
     * IMPORTANT:
     * Authentication context must be above ExaminationProvider.
     *
     * The examination API requires JWT authentication.
     * Therefore, we do not call the examination API until
     * a valid token exists.
     */
    const { token } = useAuth();


    const [exams, setExams] =
        useState<ExamSetup[]>([]);

    const [examMarks, setExamMarks] =
        useState<ExamMark[]>([]);

    const [examSchedules, setExamSchedules] =
        useState<ExamSchedule[]>([]);


    // =========================================================
    // LOAD EXAMINATION DATA
    // =========================================================

    const refreshExamData = useCallback(async () => {

        /*
         * IMPORTANT:
         *
         * When the user is on the login page there is no JWT.
         *
         * Previously this function was still calling:
         *
         * GET /api/examination-new/options
         *
         * which resulted in:
         *
         * 401 Unauthorized
         *
         * Do not call protected APIs without authentication.
         */
        if (!token) {
            return;
        }


        try {

            const response =
                await fetchExamOptionsApi();


            if (
                response &&
                response.success &&
                response.data
            ) {

                // Map backend response to frontend ExamSetup model

                const mappedExams: ExamSetup[] =
                    (
                        response.data.existingExams || []
                    ).map((e: any) => ({

                        id:
                            e.examId?.toString() || '',

                        name:
                            e.examName || '',

                        term:
                            e.academicTerm || 'Term 1',

                        startDate:
                            e.startDate || '',

                        endDate:
                            e.endDate || '',

                        classes:
                            e.applicableClasses || [],

                        status:
                            e.status || 'Draft',

                        assessmentType:
                            e.assessmentType || 'Main Exam'

                    }));


                setExams(mappedExams);
            }

        } catch (err: any) {

            /*
             * 401 is expected if the token has expired
             * or the user has become unauthenticated.
             *
             * Do not display an examination error on the
             * login page in this situation.
             */

            if (
                err?.status === 401 ||
                err?.response?.status === 401
            ) {
                return;
            }


            console.error(
                'Failed to load examination options:',
                err
            );
        }

    }, [token]);


    // =========================================================
    // LOAD DATA WHEN AUTHENTICATION BECOMES AVAILABLE
    // =========================================================

    useEffect(() => {

        /*
         * refreshExamData itself checks the token.
         *
         * When login succeeds and the token changes,
         * refreshExamData is recreated and this effect runs.
         */

        refreshExamData();

    }, [refreshExamData]);


    // =========================================================
    // ADD EXAM
    // =========================================================

    const handleAddExam = async (
        examData: Omit<ExamSetup, 'id'>
    ) => {

        try {

            await saveExamDetailsApi({

                examName:
                    examData.name,

                assessmentType:
                    examData.assessmentType ||
                    'Main Exam',

                academicTerm:
                    examData.term ||
                    'Term 1',

                startDate:
                    examData.startDate,

                endDate:
                    examData.endDate,

                applicableClasses:
                    examData.classes || []

            });


            addToast(
                'success',
                'Exam Setup Saved',
                'Examination configuration created successfully.'
            );


            await refreshExamData();

        } catch (err: any) {

            addToast(
                'error',
                'API Error',
                err?.message ||
                'Failed to save exam details.'
            );

        }
    };


    // =========================================================
    // UPDATE EXAM
    // =========================================================

    const handleUpdateExam = async (
        id: string,
        updates: Partial<ExamSetup>
    ) => {

        try {

            const original =
                exams.find(
                    e => e.id === id
                );


            if (!original) {
                return;
            }


            await saveExamDetailsApi({

                examId:
                    parseInt(id),

                examName:
                    updates.name ||
                    original.name,

                assessmentType:
                    updates.assessmentType ||
                    original.assessmentType ||
                    'Main Exam',

                academicTerm:
                    updates.term ||
                    original.term ||
                    'Term 1',

                startDate:
                    updates.startDate ||
                    original.startDate,

                endDate:
                    updates.endDate ||
                    original.endDate,

                applicableClasses:
                    updates.classes ||
                    original.classes ||
                    []

            });


            addToast(
                'success',
                'Exam Setup Updated',
                'Examination details updated successfully.'
            );


            await refreshExamData();

        } catch (err: any) {

            addToast(
                'error',
                'API Error',
                err?.message ||
                'Failed to update exam details.'
            );

        }
    };


    // =========================================================
    // DELETE EXAM
    // =========================================================

    const handleDeleteExam = async (
        id: string
    ) => {

        try {

            await deleteExamApi(
                parseInt(id)
            );


            addToast(
                'success',
                'Exam Deleted',
                'Examination configuration removed successfully.'
            );


            await refreshExamData();

        } catch (err: any) {

            addToast(
                'error',
                'API Error',
                err?.message ||
                'Failed to delete examination.'
            );

        }
    };


    // =========================================================
    // SAVE MARKS
    // =========================================================

    const handleSaveMarks = async (
        marksData: Omit<ExamMark, 'id'>[]
    ) => {

        try {

            /*
             * Group marks by:
             *
             * exam
             * class
             * section
             * subject
             */

            const groups:
                Record<
                    string,
                    typeof marksData
                > = {};


            marksData.forEach(m => {

                const key =
                    `${m.examId}_` +
                    `${m.className || 'Class 1'}_` +
                    `${m.section || 'Section A'}_` +
                    `${m.subject}`;


                if (!groups[key]) {
                    groups[key] = [];
                }


                groups[key].push(m);

            });


            // Process every group

            for (
                const key of Object.keys(groups)
            ) {

                const items =
                    groups[key];


                const first =
                    items[0];


                const payload = {

                    examId:
                        parseInt(first.examId),

                    className:
                        first.className ||
                        'Class 1',

                    sectionName:
                        first.section ||
                        'Section A',

                    subjectCode:
                        first.subject,


                    students:
                        items.map(
                            (m, idx) => ({

                                entryId:
                                    0,

                                rollNo:
                                    (idx + 1).toString(),

                                studentName:
                                    m.studentName ||
                                    `Student ${m.studentId}`,

                                admissionNo:
                                    m.studentId,

                                attendanceStatus:
                                    'Present',

                                marksObtained:
                                    m.marksObtained,

                                maxMarks:
                                    m.maxMarks ||
                                    100,

                                grade:
                                    m.grade ||
                                    'N/A',

                                evaluatorRemarks:
                                    m.remarks ||
                                    '',

                                status:
                                    m.isLocked
                                        ? 'Submitted'
                                        : 'Draft'

                            })
                        ),


                    isFinalSubmit:
                        items.every(
                            m => m.isLocked
                        )

                };


                if (
                    payload.isFinalSubmit
                ) {

                    await submitMarksEntryApi({

                        ...payload,

                        isFinalSubmit:
                            true

                    });

                } else {

                    await saveMarksEntryDraftApi(
                        payload
                    );

                }

            }


            addToast(
                'success',
                'Marks Saved',
                'Student marks updated successfully.'
            );


            // Refresh local marks state

            const updatedMarks:
                ExamMark[] =
                marksData.map(
                    (m, idx) => ({

                        ...m,

                        id:
                            `mrk_${m.examId}_` +
                            `${m.studentId}_` +
                            `${idx}`

                    })
                ) as ExamMark[];


            setExamMarks(prev => {

                const filtered =
                    prev.filter(
                        pm =>
                            !marksData.some(
                                m =>
                                    m.examId ===
                                    pm.examId &&

                                    m.studentId ===
                                    pm.studentId &&

                                    m.subject ===
                                    pm.subject
                            )
                    );


                return [
                    ...filtered,
                    ...updatedMarks
                ];

            });


        } catch (err: any) {

            addToast(
                'error',
                'API Error',
                err?.message ||
                'Failed to save student marks.'
            );

        }

    };


    // =========================================================
    // ADD EXAM SCHEDULE
    // =========================================================

    const handleAddExamSchedule =
        async (
            scheduleData:
                Omit<ExamSchedule, 'id'>
        ) => {

            try {

                await saveScheduleTimetableApi({

                    examId:
                        parseInt(
                            scheduleData.examId
                        ),

                    className:
                        scheduleData.className,

                    sectionName:
                        scheduleData.section ||
                        'Section A',

                    timetable: [

                        {

                            slotId:
                                0,

                            subjectCode:
                                scheduleData.subject,

                            subjectName:
                                scheduleData.subject,

                            totalMarks:
                                100,

                            examDate:
                                scheduleData.date,

                            timeSlot:
                                `${scheduleData.startTime} - ${scheduleData.endTime}`,

                            duration:
                                '3 hours',

                            roomHall:
                                scheduleData.room ||
                                'Main Hall',

                            invigilatorFaculty:
                                'Unassigned'

                        }

                    ]

                });


                addToast(
                    'success',
                    'Schedule Saved',
                    'Exam schedule slot created successfully.'
                );


                setExamSchedules(
                    prev => [
                        ...prev,

                        {
                            ...scheduleData,
                            id:
                                `sch_${Date.now()}`
                        }

                    ]
                );


            } catch (err: any) {

                addToast(
                    'error',
                    'API Error',
                    err?.message ||
                    'Failed to save exam schedule.'
                );

            }

        };


    // =========================================================
    // UPDATE EXAM SCHEDULE
    // =========================================================

    const handleUpdateExamSchedule =
        async (
            id: string,
            updates: Partial<ExamSchedule>
        ) => {

            // Legacy client-side update

            setExamSchedules(
                prev =>
                    prev.map(
                        s =>
                            s.id === id
                                ? {
                                    ...s,
                                    ...updates
                                }
                                : s
                    )
            );

        };


    // =========================================================
    // DELETE EXAM SCHEDULE
    // =========================================================

    const handleDeleteExamSchedule =
        async (
            id: string
        ) => {

            setExamSchedules(
                prev =>
                    prev.filter(
                        s => s.id !== id
                    )
            );

        };


    // =========================================================
    // PROVIDER
    // =========================================================

    return (

        <ExaminationContext.Provider
            value={{

                exams,

                examMarks,

                examSchedules,

                addExam:
                    handleAddExam,

                updateExam:
                    handleUpdateExam,

                deleteExam:
                    handleDeleteExam,

                saveMarks:
                    handleSaveMarks,

                addExamSchedule:
                    handleAddExamSchedule,

                updateExamSchedule:
                    handleUpdateExamSchedule,

                deleteExamSchedule:
                    handleDeleteExamSchedule,

                refreshExamData

            }}
        >

            {children}

        </ExaminationContext.Provider>

    );

};


// =========================================================
// HOOK
// =========================================================

export const useExamination = () => {

    const context =
        useContext(
            ExaminationContext
        );


    if (
        context === undefined
    ) {

        throw new Error(
            'useExamination must be used within an ExaminationProvider'
        );

    }
  


    return context;

};