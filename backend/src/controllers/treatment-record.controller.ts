import { Request, Response } from 'express';
import treatmentRecordService from '../services/treatment-record.service';

export const createTreatmentRecord = async (req: Request, res: Response): Promise<any> => {
  try {
    const record = await treatmentRecordService.createTreatmentRecord(req.body);
    return res.status(201).json(record);
  } catch (error) {
    console.error('Lỗi khi tạo hồ sơ điều trị:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getTreatmentRecords = async (req: Request, res: Response): Promise<any> => {
  try {
    const records = await treatmentRecordService.getTreatmentRecords();
    return res.json(records);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hồ sơ điều trị:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

export const assignTreatmentRecord = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const result = await treatmentRecordService.assignTreatmentRecord(id as string);
    return res.json(result);
  } catch (error: any) {
    console.error('Lỗi khi điều phối hồ sơ điều trị:', error);
    if (error.message === 'Không tìm thấy hồ sơ điều trị') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};
