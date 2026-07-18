import React, { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';

const CrewReviewList = ({ reviews = [], canManage, onCreate, onDelete }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        await onCreate({ rating, comment });
        setComment('');
        setRating(5);
    };

    return (
        <div className="space-y-4">
            {canManage ? (
                <form onSubmit={submit} className="rounded-xl border border-vps-gray/20 bg-[#181818] p-3">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button type="button" key={value} onClick={() => setRating(value)}>
                                <Star className={`h-5 w-5 ${value <= rating ? 'fill-vps-gold text-vps-gold' : 'text-vps-ivory/30'}`} />
                            </button>
                        ))}
                    </div>
                    <textarea rows="2" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Nhận xét nội bộ" className="mt-2 w-full rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                    <div className="mt-2 flex justify-end"><button className="rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black">Lưu review</button></div>
                </form>
            ) : null}

            {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-vps-gray/30 p-4 text-sm text-vps-ivory/60">Chưa có review nội bộ.</div>
            ) : (
                <div className="space-y-2">
                    {reviews.map((review) => (
                        <div key={review.id} className="rounded-xl border border-vps-gray/20 bg-[#181818] p-3 text-sm text-vps-ivory/80">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-vps-gold text-vps-gold' : 'text-vps-ivory/20'}`} />)}</div>
                                {canManage ? <button onClick={() => onDelete(review.id)} className="text-rose-300"><Trash2 className="h-4 w-4" /></button> : null}
                            </div>
                            {review.comment ? <p className="mt-2 text-vps-ivory/70">{review.comment}</p> : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CrewReviewList;
